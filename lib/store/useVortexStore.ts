/** Zustand store: DID, peers, messages, and AI mode. */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ChatWireMessage } from '@/lib/p2p/trysteroSetup';
import type { DIDKeyPair } from '@/lib/did/keyGenerator';
import { getStoredDIDKeyPair } from '@/lib/did/keyGenerator';
import { loadLocalHistory, saveLocalHistory } from '@/lib/p2p/torrentHistory';

export interface ChatPeer { peerId: string; connectedAt: number; }
export interface VortexMessage { id: string; roomId: string; senderDid: string; body: string; timestamp: number; signature: string; encrypted: boolean; mine: boolean; }
export type AiMode = 'local' | 'api';
export interface ActiveRoom { id: string; peerDid: string | null; createdAt: number; lastMessageAt: number; }

interface VortexState {
  currentDid: DIDKeyPair | null;
  activeRooms: ActiveRoom[];
  messages: Record<string, VortexMessage[]>;
  peers: Record<string, ChatPeer[]>;
  aiMode: AiMode;
  apiKey: string | null;
  ensureDid: () => DIDKeyPair;
  setApiKey: (apiKey: string | null) => void;
  switchAiMode: (mode: AiMode) => void;
  startRoom: (roomId: string, peerDid?: string | null) => string;
  addMessage: (roomId: string, message: VortexMessage) => void;
  ingestWireMessage: (roomId: string, message: ChatWireMessage, mine: boolean) => void;
  setPeers: (roomId: string, peers: ChatPeer[]) => void;
}

export function toVortexMessage(roomId: string, message: ChatWireMessage, mine: boolean): VortexMessage {
  return { id: message.id, roomId, senderDid: message.senderDid, body: message.body, timestamp: message.timestamp, signature: message.signature, encrypted: message.encrypted, mine };
}

export const useVortexStore = create<VortexState>()(
  persist(
    immer((set) => ({
      currentDid: null,
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
      setApiKey: (apiKey) => set((state) => { state.apiKey = apiKey && apiKey.trim().length > 0 ? apiKey.trim() : null; }),
      switchAiMode: (mode) => set((state) => { state.aiMode = mode; }),
      startRoom: (roomId, peerDid = null) => {
        const normalized = roomId.trim();
        if (!normalized) throw new Error('Empty room identifier');
        const localHistory = loadLocalHistory(normalized);
        set((state) => {
          const existing = state.activeRooms.find((room) => room.id === normalized);
          const lastMessageAt = localHistory.length > 0 ? (localHistory[localHistory.length - 1] as ChatWireMessage).timestamp : (existing?.lastMessageAt ?? Date.now());
          if (existing) {
            existing.peerDid = peerDid ?? existing.peerDid;
            existing.lastMessageAt = Math.max(existing.lastMessageAt, lastMessageAt);
          } else {
            state.activeRooms.unshift({ id: normalized, peerDid, createdAt: Date.now(), lastMessageAt });
          }
          state.activeRooms.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
          if (!state.messages[normalized]) {
            state.messages[normalized] = localHistory.map((item) => toVortexMessage(normalized, item, false));
          }
          if (!state.peers[normalized]) state.peers[normalized] = [];
        });
        return normalized;
      },
      addMessage: (roomId, message) => set((state) => {
        const list = state.messages[roomId] ?? [];
        if (list.some((item) => item.id === message.id)) return;
        list.push(message);
        list.sort((a, b) => a.timestamp - b.timestamp);
        state.messages[roomId] = list.slice(-500);
        const room = state.activeRooms.find((item) => item.id === roomId);
        if (room) {
          room.lastMessageAt = message.timestamp;
          state.activeRooms.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
        }
      }),
      ingestWireMessage: (roomId, message, mine) => set((state) => {
        const list = state.messages[roomId] ?? loadLocalHistory(roomId).map((item) => toVortexMessage(roomId, item, false));
        if (list.some((item) => item.id === message.id)) { state.messages[roomId] = list; return; }
        list.push(toVortexMessage(roomId, message, mine));
        list.sort((a, b) => a.timestamp - b.timestamp);
        state.messages[roomId] = list.slice(-500);
        saveLocalHistory(roomId, list.map((item) => ({ id: item.id, senderDid: item.senderDid, body: item.body, timestamp: item.timestamp, signature: item.signature, encrypted: item.encrypted })));
        const room = state.activeRooms.find((item) => item.id === roomId);
        if (room) {
          room.lastMessageAt = message.timestamp;
          state.activeRooms.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
        }
      }),
      setPeers: (roomId, peers) => set((state) => { state.peers[roomId] = peers; }),
    })),
    {
      name: 'gotoap-vortex-v1',
      partialize: (state) => ({ aiMode: state.aiMode, apiKey: state.apiKey, activeRooms: state.activeRooms }) as VortexState,
      merge: (persisted, current) => {
        const saved = persisted as Partial<Pick<VortexState, 'aiMode' | 'apiKey' | 'activeRooms'>>;
        return { ...current, aiMode: saved.aiMode ?? current.aiMode, apiKey: saved.apiKey ?? null, activeRooms: Array.isArray(saved.activeRooms) ? saved.activeRooms : [] };
      },
    },
  ),
);

export function useRoomMessages(roomId: string): VortexMessage[] { return useVortexStore((state) => state.messages[roomId] ?? []); }
export function useRoomPeers(roomId: string): ChatPeer[] { return useVortexStore((state) => state.peers[roomId] ?? []); }
