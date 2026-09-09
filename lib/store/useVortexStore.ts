/** Zustand store: DID, profile, peers, messages, pins, and AI mode. */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ChatWireMessage, MessageKind, PeerProfilePayload } from '@/lib/p2p/trysteroSetup';
import type { DIDKeyPair } from '@/lib/did/keyGenerator';
import { getStoredDIDKeyPair } from '@/lib/did/keyGenerator';
import { loadLocalHistory, mergeHistory, patchLocalHistory, saveLocalHistory } from '@/lib/p2p/torrentHistory';
import type { EncryptedPayload } from '@/lib/crypto/encryption';
import { decryptText, deriveRoomKey } from '@/lib/crypto/encryption';

export interface ChatPeer { peerId: string; connectedAt: number; }
export interface MessageMedia { name: string; mime: string; size: number; dataUri: string; durationMs?: number; }
export interface VortexMessage {
  id: string;
  roomId: string;
  senderDid: string;
  body: string;
  timestamp: number;
  signature: string;
  encrypted: boolean;
  mine: boolean;
  kind: MessageKind;
  media: MessageMedia | null;
  replyToId: string | null;
  editedAt: number | null;
  deletedAt: number | null;
  viewed: boolean;
  forwarded: boolean;
}
export type AiMode = 'local' | 'api';
export type ThemeMode = 'dark' | 'system';
export interface ActiveRoom { id: string; peerDid: string | null; title: string; pinned: boolean; muted: boolean; archived: boolean; createdAt: number; lastMessageAt: number; }
export interface UserProfile { displayName: string; bio: string; colorId: string; }

export const DEFAULT_PROFILE: UserProfile = { displayName: '', bio: '', colorId: 'blue' };
export const AVATAR_COLOR_IDS = ['blue', 'cyan', 'green', 'orange', 'red', 'pink', 'violet'] as const;
export type AvatarColorId = (typeof AVATAR_COLOR_IDS)[number];

/** Pins first, then the most recent activity. */
function sortRooms(rooms: ActiveRoom[]): void {
  rooms.sort((a, b) => (a.pinned === b.pinned ? b.lastMessageAt - a.lastMessageAt : a.pinned ? -1 : 1));
}

/** Parses a decrypted payload string into a body plus optional media. */
export function parsePlainPayload(raw: string): { body: string; media: MessageMedia | null } {
  try {
    const parsed = JSON.parse(raw) as { body?: unknown; media?: unknown };
    if (parsed && typeof parsed.body === 'string') {
      const media = parsed.media && typeof parsed.media === 'object'
        ? (parsed.media as MessageMedia)
        : null;
      return { body: parsed.body, media };
    }
  } catch {
    /* Plain text body: keep as is. */
  }
  return { body: raw, media: null };
}

type PersistedVortexState = Pick<VortexState, 'aiMode' | 'apiKey' | 'activeRooms' | 'profile' | 'pinnedMessages' | 'theme'>;

interface VortexState {
  currentDid: DIDKeyPair | null;
  profile: UserProfile;
  activeRooms: ActiveRoom[];
  messages: Record<string, VortexMessage[]>;
  peers: Record<string, ChatPeer[]>;
  peerProfiles: Record<string, PeerProfilePayload>;
  pinnedMessages: Record<string, string | null>;
  unread: Record<string, number>;
  aiMode: AiMode;
  apiKey: string | null;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  ensureDid: () => DIDKeyPair;
  updateProfile: (patch: Partial<UserProfile>) => void;
  setApiKey: (apiKey: string | null) => void;
  switchAiMode: (mode: AiMode) => void;
  startRoom: (roomId: string, peerDid?: string | null) => string;
  renameRoom: (roomId: string, title: string) => void;
  toggleRoomPinned: (roomId: string) => void;
  toggleRoomMuted: (roomId: string) => void;
  toggleRoomArchived: (roomId: string) => void;
  deleteRoom: (roomId: string) => void;
  addMessage: (roomId: string, message: VortexMessage) => void;
  ingestWireMessage: (roomId: string, wire: ChatWireMessage, plainPayload: string, mine: boolean) => void;
  editMessage: (roomId: string, messageId: string, body: string, editedAt?: number) => void;
  deleteMessage: (roomId: string, messageId: string, at?: number) => void;
  togglePinnedMessage: (roomId: string, messageId: string) => void;
  markAllViewed: (roomId: string) => void;
  markViewed: (roomId: string, messageId: string) => void;
  markRoomOpened: (roomId: string) => void;
  receiveWireMessage: (roomId: string, wire: ChatWireMessage) => Promise<void>;
  hydrateRoom: (roomId: string) => Promise<void>;
  setPeers: (roomId: string, peers: ChatPeer[]) => void;
  setPeerProfile: (did: string, profile: PeerProfilePayload) => void;
}

/** Converts a wire message plus a decrypted payload into a display message. */
export function toVortexMessage(roomId: string, wire: ChatWireMessage, plainPayload: string, mine: boolean): VortexMessage {
  const parsed = parsePlainPayload(plainPayload);
  return {
    id: wire.id,
    roomId,
    senderDid: wire.senderDid,
    body: parsed.body,
    timestamp: wire.timestamp,
    signature: wire.signature,
    encrypted: wire.encrypted,
    mine,
    kind: wire.kind ?? 'text',
    media: parsed.media,
    replyToId: wire.replyToId ?? null,
    editedAt: wire.editedAt ?? null,
    deletedAt: wire.deleted ? wire.timestamp : null,
    viewed: false,
    forwarded: Boolean(wire.forwarded),
  };
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
      peerProfiles: {},
      pinnedMessages: {},
      unread: {},
      aiMode: (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_DEFAULT_AI_MODE === 'api' ? 'api' : 'local') as AiMode,
      apiKey: null,
      theme: 'dark',
      setTheme: (theme) => set((state) => { state.theme = theme; }),
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
            state.activeRooms.unshift({ id: normalized, peerDid, title: '', pinned: false, muted: false, archived: false, createdAt: Date.now(), lastMessageAt: Date.now() });
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
      toggleRoomArchived: (roomId) => set((state) => {
        const room = state.activeRooms.find((item) => item.id === roomId);
        if (room) {
          room.archived = !room.archived;
          sortRooms(state.activeRooms);
        }
      }),
      deleteRoom: (roomId) => {
        set((state) => {
          state.activeRooms = state.activeRooms.filter((room) => room.id !== roomId);
          delete state.messages[roomId];
          delete state.peers[roomId];
          delete state.pinnedMessages[roomId];
          delete state.unread[roomId];
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
      ingestWireMessage: (roomId, wire, plainPayload, mine) => {
        const message = toVortexMessage(roomId, wire, plainPayload, mine);
        set((state) => {
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
          if (!mine && message.kind === 'text') state.unread[roomId] = (state.unread[roomId] ?? 0) + 1;
        });
        saveLocalHistory(roomId, mergeHistory(loadLocalHistory(roomId), wire));
      },
      editMessage: (roomId, messageId, body, editedAt = Date.now()) => {
        set((state) => {
          const list = state.messages[roomId] ?? [];
          const target = list.find((item) => item.id === messageId);
          if (target) {
            target.body = body;
            target.editedAt = editedAt;
          }
        });
      },
      deleteMessage: (roomId, messageId, at = Date.now()) => {
        set((state) => {
          const list = state.messages[roomId] ?? [];
          const target = list.find((item) => item.id === messageId);
          if (target) {
            target.body = '';
            target.deletedAt = at;
            target.media = null;
            target.kind = 'text';
          }
          if (state.pinnedMessages[roomId] === messageId) state.pinnedMessages[roomId] = null;
        });
        patchLocalHistory(roomId, messageId, { deleted: true, body: '' });
      },
      togglePinnedMessage: (roomId, messageId) => set((state) => {
        state.pinnedMessages[roomId] = state.pinnedMessages[roomId] === messageId ? null : messageId;
      }),
      markAllViewed: (roomId) => set((state) => {
        for (const message of state.messages[roomId] ?? []) {
          if (message.mine) message.viewed = true;
        }
      }),
      markViewed: (roomId, messageId) => set((state) => {
        const message = (state.messages[roomId] ?? []).find((item) => item.id === messageId);
        if (message) message.viewed = true;
      }),
      receiveWireMessage: async (roomId, wire) => {
        try {
          if (wire.typing || wire.receiptIds || wire.profile || wire.call) return;
          let plain = wire.body;
          if (wire.encrypted) {
            const key = await deriveRoomKey(roomId);
            plain = await decryptText(JSON.parse(wire.body) as EncryptedPayload, key);
          }
          const me = getStoredDIDKeyPair();
          get().ingestWireMessage(roomId, wire, plain, me ? wire.senderDid === me.did : false);
        } catch (error) {
          console.error('Failed to process the incoming wire message:', error);
        }
      },
      markRoomOpened: (roomId) => set((state) => { state.unread[roomId] = 0; }),
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
            if (wire.typing || wire.receiptIds || wire.profile || wire.call) continue;
            const plain = await decryptStoredWire(roomId, wire, key);
            list.push(toVortexMessage(roomId, wire, plain, me ? wire.senderDid === me.did : false));
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
      setPeerProfile: (did, profile) => set((state) => { state.peerProfiles[did] = profile; }),
    })),
    {
      name: 'gotoap-vortex-v2',
      partialize: (state): PersistedVortexState => ({
        aiMode: state.aiMode,
        apiKey: state.apiKey,
        activeRooms: state.activeRooms,
        profile: state.profile,
        pinnedMessages: state.pinnedMessages,
        theme: state.theme,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<PersistedVortexState>;
        const rooms: ActiveRoom[] = (Array.isArray(saved.activeRooms) ? saved.activeRooms : []).map((room) => ({
          id: String(room.id),
          peerDid: typeof room.peerDid === 'string' ? room.peerDid : null,
          title: typeof room.title === 'string' ? room.title : '',
          pinned: Boolean(room.pinned),
          muted: Boolean(room.muted),
          archived: Boolean(room.archived),
          createdAt: typeof room.createdAt === 'number' ? room.createdAt : Date.now(),
          lastMessageAt: typeof room.lastMessageAt === 'number' ? room.lastMessageAt : Date.now(),
        }));
        return {
          ...current,
          aiMode: saved.aiMode ?? current.aiMode,
          apiKey: saved.apiKey ?? null,
          activeRooms: rooms,
          profile: { ...DEFAULT_PROFILE, ...(saved.profile ?? {}) },
          pinnedMessages: saved.pinnedMessages ?? {},
          theme: saved.theme === 'system' ? 'system' : 'dark',
        };
      },
    },
  ),
);

export function useRoomMessages(roomId: string): VortexMessage[] { return useVortexStore((state) => state.messages[roomId] ?? []); }
export function useRoomPeers(roomId: string): ChatPeer[] { return useVortexStore((state) => state.peers[roomId] ?? []); }
