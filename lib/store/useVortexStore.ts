/** Zustand store: DID, profile, peers, messages, and AI mode. */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ChatWireMessage } from '@/lib/p2p/trysteroSetup';
import type { DIDKeyPair } from '@/lib/did/keyGenerator';
import { getStoredDIDKeyPair } from '@/lib/did/keyGenerator';
import { loadLocalHistory, mergeHistory, saveLocalHistory } from '@/lib/p2p/torrentHistory';
import type { EncryptedPayload } from '@/lib/crypto/encryption';
import { decryptText, deriveRoomKey } from '@/lib/crypto/encryption';

export interface ChatPeer { peerId: string; connectedAt: number; }
export interface VortexMessage { id: string; roomId: string; senderDid: string; body: string; timestamp: number; signature: string; encrypted: boolean; mine: boolean; }
export type AiMode = 'local' | 'api';
export interface ActiveRoom { id: string; peerDid: string | null; title: string; pinned: boolean; muted: boolean; createdAt: number; lastMessageAt: number; }
export interface UserProfile { displayName: string; bio: string; colorId: string; }

export const DEFAULT_PROFILE: UserProfile = { displayName: '', bio: '', colorId: 'blue' };
export const AVATAR_COLOR_IDS = ['blue', 'cyan', 'green', 'orange', 'red', 'pink', 'violet'] as const;
export type AvatarColorId = (typeof AVATAR_COLOR_IDS)[number];

/** Pins first, then the most recent activity. */
function sortRooms(rooms: ActiveRoom[]): void {
  rooms.sort((a, b) => (a.pinned === b.pinned ? b.lastMessageAt - a.lastMessageAt : a.pinned ? -1 : 1));
}

interface VortexState {
  currentDid: DIDKeyPair | null;
  profile: UserProfile;
  activeRooms: ActiveRoom[];
  messages: Record<string, VortexMessage[]>;
  peers: Record<string, ChatPeer[]>;
  aiMode: AiMode;
  apiKey: string | null;
  ensureDid: () => DIDKeyPair;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setApiKey: (apiKey: string | null) => void;
  switchAiMode: (mode: AiMode) => void;
  startRoom: (roomId: string, peerDid?: string | null) => string;
  renameRoom: (roomId: string, title: string) => void;
  toggleRoomPinned: (roomId: string) => void;
  toggleRoomMuted: (roomId: string) => void;
  deleteRoom: (roomId: string) => void;
  addMessage: (roomId: string, message: VortexMessage) => void;
  ingestWireMessage: (roomId: string, wire: ChatWireMessage, plainBody: string, mine: boolean) => void;
  hydrateRoom: (roomId: string) => Promise<void>;
  setPeers: (roomId: string, peers: ChatPeer[]) => void;
}

/** Converts a wire message (ciphertext body) into a display message (plaintext body). */
export function toVortexMessage(roomId: string, message: ChatWireMessage, plainBody: string, mine: boolean): VortexMessage {
  return { id: message.id, roomId, senderDid: message.senderDid, body: plainBody, timestamp: message.timestamp, signature: message.signature, encrypted: message.encrypted, mine };
}

/** Decrypts a stored wire body; falls back to a placeholder when undecryptable. */
async function decryptStoredWire(roomId: string, wire: ChatWireMessage, key: CryptoKey | null): Promise<string> {
  if (!wire.encrypted) return wire.body;
  if (!key) return '(encrypted message)';
  try {
    return await decryptText(JSON.parse(wire.body) as EncryptedPayload, key);
  } catch (error) {
    console.error('Failed to decrypt a stored message in room', roomId, error);
    return '(encrypted message)';
  }
}

export const useVortexStore = create<VortexState>()(
  persist(
    immer((set, get) => ({
      currentDid: null,
      profile: DEFAULT_PROFILE,
      activeRooms: [],
      messages: {},
      peers: {},
      aiMode: (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEFAULT_AI_MODE === 'api' ? 'api' : 'local') as AiMode,
      apiKey: null,
      ensureDid: () => {
        const stored = getStoredDIDKeyPair();
        if (stored) {
          set((state) => { state.currentDid = stored; });
          return stored;
        }
        throw new Error('The DID wallet has not been created yet');
      },
      updateProfile: (patch) => set((state) => { state.profile = { ...state.profile, ...patch }; }),
      setApiKey: (apiKey) => set((state) => { state.apiKey = apiKey && apiKey.trim().length > 0 ? apiKey.trim() : null; }),
      switchAiMode: (mode) => set((state) => { state.aiMode = mode; }),
      startRoom: (roomId, peerDid = null) => {
        const normalized = roomId.trim();
        if (!normalized) throw new Error('Empty room identifier');
        set((state) => {
          const existing = state.activeRooms.find((room) => room.id === normalized);
          if (existing) {
            existing.peerDid = peerDid ?? existing.peerDid;
          } else {
            state.activeRooms.unshift({ id: normalized, peerDid, title: '', pinned: false, muted: false, createdAt: Date.now(), lastMessageAt: Date.now() });
          }
          sortRooms(state.activeRooms);
          if (!state.messages[normalized]) state.messages[normalized] = [];
          if (!state.peers[normalized]) state.peers[normalized] = [];
        });
        return normalized;
      },
      renameRoom: (roomId, title) => set((state) => {
        const room = state.activeRooms.find((item) => item.id === roomId);
        if (room) room.title = title.trim().slice(0, 64);
      }),
      toggleRoomPinned: (roomId) => set((state) => {
        const room = state.activeRooms.find((item) => item.id === roomId);
        if (room) {
          room.pinned = !room.pinned;
          sortRooms(state.activeRooms);
        }
      }),
      toggleRoomMuted: (roomId) => set((state) => {
        const room = state.activeRooms.find((item) => item.id === roomId);
        if (room) room.muted = !room.muted;
      }),
      deleteRoom: (roomId) => {
        set((state) => {
          state.activeRooms = state.activeRooms.filter((room) => room.id !== roomId);
          delete state.messages[roomId];
          delete state.peers[roomId];
        });
        saveLocalHistory(roomId, []);
      },
      addMessage: (roomId, message) => set((state) => {
        const list = state.messages[roomId] ?? [];
        if (list.some((item) => item.id === message.id)) return;
        list.push(message);
        list.sort((a, b) => a.timestamp - b.timestamp);
        state.messages[roomId] = list.slice(-500);
        const room = state.activeRooms.find((item) => item.id === roomId);
        if (room) {
          room.lastMessageAt = Math.max(room.lastMessageAt, message.timestamp);
          sortRooms(state.activeRooms);
        }
      }),
      ingestWireMessage: (roomId, wire, plainBody, mine) => {
        set((state) => {
          const list = state.messages[roomId] ?? [];
          if (list.some((item) => item.id === wire.id)) return;
          list.push(toVortexMessage(roomId, wire, plainBody, mine));
          list.sort((a, b) => a.timestamp - b.timestamp);
          state.messages[roomId] = list.slice(-500);
          const room = state.activeRooms.find((item) => item.id === roomId);
          if (room) {
            room.lastMessageAt = Math.max(room.lastMessageAt, wire.timestamp);
            sortRooms(state.activeRooms);
          }
        });
        saveLocalHistory(roomId, mergeHistory(loadLocalHistory(roomId), wire));
      },
      hydrateRoom: async (roomId) => {
        try {
          if ((get().messages[roomId] ?? []).length > 0) return;
          const wires = loadLocalHistory(roomId);
          if (wires.length === 0) return;
          const me = getStoredDIDKeyPair();
          let key: CryptoKey | null = null;
          try { key = await deriveRoomKey(roomId); } catch (error) { console.error('Failed to derive the room key for history:', error); }
          const list: VortexMessage[] = [];
          for (const wire of wires) {
            const plainBody = await decryptStoredWire(roomId, wire, key);
            list.push(toVortexMessage(roomId, wire, plainBody, me ? wire.senderDid === me.did : false));
          }
          set((state) => {
            const existing = state.messages[roomId] ?? [];
            if (existing.length > 0) return;
            const merged = [...list];
            for (const item of existing) {
              if (!merged.some((candidate) => candidate.id === item.id)) merged.push(item);
            }
            merged.sort((a, b) => a.timestamp - b.timestamp);
            state.messages[roomId] = merged.slice(-500);
          });
        } catch (error) {
          console.error('Failed to hydrate the room history:', error);
        }
      },
      setPeers: (roomId, peers) => set((state) => { state.peers[roomId] = peers; }),
    })),
    {
      name: 'gotoap-vortex-v1',
      partialize: (state) => ({ aiMode: state.aiMode, apiKey: state.apiKey, activeRooms: state.activeRooms, profile: state.profile }) as VortexState,
      merge: (persisted, current) => {
        const saved = persisted as Partial<Pick<VortexState, 'aiMode' | 'apiKey' | 'activeRooms' | 'profile'>>;
        const rooms: ActiveRoom[] = (Array.isArray(saved.activeRooms) ? saved.activeRooms : []).map((room) => ({
          id: String(room.id),
          peerDid: typeof room.peerDid === 'string' ? room.peerDid : null,
          title: typeof room.title === 'string' ? room.title : '',
          pinned: Boolean(room.pinned),
          muted: Boolean(room.muted),
          createdAt: typeof room.createdAt === 'number' ? room.createdAt : Date.now(),
          lastMessageAt: typeof room.lastMessageAt === 'number' ? room.lastMessageAt : Date.now(),
        }));
        return {
          ...current,
          aiMode: saved.aiMode ?? current.aiMode,
          apiKey: saved.apiKey ?? null,
          activeRooms: rooms,
          profile: { ...DEFAULT_PROFILE, ...(saved.profile ?? {}) },
        };
      },
    },
  ),
);

export function useRoomMessages(roomId: string): VortexMessage[] { return useVortexStore((state) => state.messages[roomId] ?? []); }
export function useRoomPeers(roomId: string): ChatPeer[] { return useVortexStore((state) => state.peers[roomId] ?? []); }
