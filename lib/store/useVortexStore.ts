/** Zustand store: DID, profile, peers, messages, pins, AI mode, reactions, calls, groups, bots, privacy. */
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
export interface ReactionEntry { emoji: string; peers: string[]; }
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
  reactions: ReactionEntry[];
}
export interface CallEntry {
  id: string;
  peerDid: string;
  type: 'incoming' | 'outgoing' | 'missed';
  video: boolean;
  startedAt: number;
  durationMs: number;
}
export interface GroupChat {
  id: string;
  title: string;
  description: string;
  avatarColor: string;
  ownerDid: string;
  members: GroupMember[];
  inviteLink: string;
  createdAt: number;
  isPublic: boolean;
}
export interface GroupMember {
  did: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: number;
  displayName?: string;
}
export interface BotInfo {
  id: string;
  name: string;
  username: string;
  description: string;
  avatarColor: string;
  ownerDid: string;
  commands: BotCommand[];
  isPublic: boolean;
  createdAt: number;
}
export interface BotCommand {
  command: string;
  description: string;
}
export interface PrivacySettings {
  lastSeen: 'everyone' | 'contacts' | 'nobody';
  profilePhoto: 'everyone' | 'contacts' | 'nobody';
  phoneNumber: 'everyone' | 'contacts' | 'nobody';
  forwardedMessages: 'everyone' | 'nobody';
  calls: 'everyone' | 'contacts' | 'nobody';
  groups: 'everyone' | 'contacts' | 'nobody';
}
export interface UserProfile {
  displayName: string;
  username: string;
  bio: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  birthday: string;
  avatarColor: string;
  language: string;
  timezone: string;
  isBot: boolean;
  isVerified: boolean;
  isPremium: boolean;
  lastSeen: number;
  online: boolean;
  privacy: PrivacySettings;
  twoFactorEnabled: boolean;
  recoveryEmail: string;
  activeSessions: SessionInfo[];
}
export interface SessionInfo {
  id: string;
  device: string;
  platform: string;
  location: string;
  lastActive: number;
  current: boolean;
}
export type AiMode = 'local' | 'api';
export type ThemeMode = 'dark' | 'system' | 'light';
export interface ActiveRoom {
  id: string;
  peerDid: string | null;
  title: string;
  pinned: boolean;
  muted: boolean;
  archived: boolean;
  createdAt: number;
  lastMessageAt: number;
  isGroup: boolean;
  isBot: boolean;
}

export const DEFAULT_PROFILE: UserProfile = {
  displayName: '',
  username: '',
  bio: '',
  phone: '',
  email: '',
  website: '',
  location: '',
  birthday: '',
  avatarColor: 'blue',
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  isBot: false,
  isVerified: false,
  isPremium: false,
  lastSeen: Date.now(),
  online: true,
  privacy: {
    lastSeen: 'everyone',
    profilePhoto: 'everyone',
    phoneNumber: 'contacts',
    forwardedMessages: 'everyone',
    calls: 'everyone',
    groups: 'everyone',
  },
  twoFactorEnabled: false,
  recoveryEmail: '',
  activeSessions: [],
};

export const AVATAR_COLOR_IDS = ['blue', 'cyan', 'green', 'orange', 'red', 'pink', 'violet'] as const;
export type AvatarColorId = (typeof AVATAR_COLOR_IDS)[number];

function sortRooms(rooms: ActiveRoom[]): void {
  rooms.sort((a, b) => (a.pinned === b.pinned ? b.lastMessageAt - a.lastMessageAt : a.pinned ? -1 : 1));
}

export function parsePlainPayload(raw: string): { body: string; media: MessageMedia | null } {
  try {
    const parsed = JSON.parse(raw) as { body?: unknown; media?: unknown };
    if (parsed && typeof parsed.body === 'string') {
      const media = parsed.media && typeof parsed.media === 'object' ? (parsed.media as MessageMedia) : null;
      return { body: parsed.body, media };
    }
  } catch {
    /* Plain text body: keep as is. */
  }
  return { body: raw, media: null };
}

type PersistedVortexState = Pick<VortexState, 'aiMode' | 'apiKey' | 'activeRooms' | 'profile' | 'pinnedMessages' | 'theme' | 'callHistory' | 'groups' | 'bots' | 'peerProfiles'>;

interface VortexState {
  currentDid: DIDKeyPair | null;
  profile: UserProfile;
  activeRooms: ActiveRoom[];
  messages: Record<string, VortexMessage[]>;
  peers: Record<string, ChatPeer[]>;
  peerProfiles: Record<string, PeerProfilePayload>;
  pinnedMessages: Record<string, string | null>;
  unread: Record<string, number>;
  callHistory: CallEntry[];
  groups: GroupChat[];
  bots: BotInfo[];
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
  toggleReaction: (roomId: string, messageId: string, emoji: string, myDid: string) => void;
  togglePinnedMessage: (roomId: string, messageId: string) => void;
  markAllViewed: (roomId: string) => void;
  markViewed: (roomId: string, messageId: string) => void;
  markRoomOpened: (roomId: string) => void;
  receiveWireMessage: (roomId: string, wire: ChatWireMessage) => Promise<void>;
  hydrateRoom: (roomId: string) => Promise<void>;
  setPeers: (roomId: string, peers: ChatPeer[]) => void;
  setPeerProfile: (did: string, profile: PeerProfilePayload) => void;
  addCall: (entry: CallEntry) => void;
  createGroup: (title: string, description: string, isPublic: boolean) => string;
  updateGroup: (groupId: string, patch: Partial<GroupChat>) => void;
  deleteGroup: (groupId: string) => void;
  addGroupMember: (groupId: string, did: string, role?: GroupMember['role']) => void;
  removeGroupMember: (groupId: string, did: string) => void;
  createBot: (name: string, username: string, description: string) => string;
  updateBot: (botId: string, patch: Partial<BotInfo>) => void;
  deleteBot: (botId: string) => void;
}

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
    reactions: [],
  };
}

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
      callHistory: [],
      groups: [],
      bots: [],
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
      updateProfile: (patch) => set((state) => { state.profile = { ...state.profile, ...patch, privacy: { ...state.profile.privacy, ...(patch.privacy ?? {}) } }; }),
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
            state.activeRooms.unshift({ id: normalized, peerDid, title: '', pinned: false, muted: false, archived: false, createdAt: Date.now(), lastMessageAt: Date.now(), isGroup: false, isBot: false });
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
        if (room) { room.pinned = !room.pinned; sortRooms(state.activeRooms); }
      }),
      toggleRoomMuted: (roomId) => set((state) => {
        const room = state.activeRooms.find((item) => item.id === roomId);
        if (room) room.muted = !room.muted;
      }),
      toggleRoomArchived: (roomId) => set((state) => {
        const room = state.activeRooms.find((item) => item.id === roomId);
        if (room) { room.archived = !room.archived; sortRooms(state.activeRooms); }
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
        if (room) { room.lastMessageAt = Math.max(room.lastMessageAt, message.timestamp); sortRooms(state.activeRooms); }
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
          if (room) { room.lastMessageAt = Math.max(room.lastMessageAt, message.timestamp); sortRooms(state.activeRooms); }
          if (!mine && message.kind === 'text') state.unread[roomId] = (state.unread[roomId] ?? 0) + 1;
        });
        saveLocalHistory(roomId, mergeHistory(loadLocalHistory(roomId), wire));
      },
      toggleReaction: (roomId, messageId, emoji, myDid) => set((state) => {
        const list = state.messages[roomId] ?? [];
        const target = list.find((item) => item.id === messageId);
        if (!target) return;
        const entry = target.reactions.find((r) => r.emoji === emoji);
        if (entry) {
          if (entry.peers.includes(myDid)) {
            entry.peers = entry.peers.filter((p) => p !== myDid);
            if (entry.peers.length === 0) target.reactions = target.reactions.filter((r) => r.emoji !== emoji);
          } else {
            entry.peers.push(myDid);
          }
        } else {
          target.reactions.push({ emoji, peers: [myDid] });
        }
      }),
      editMessage: (roomId, messageId, body, editedAt = Date.now()) => {
        set((state) => {
          const list = state.messages[roomId] ?? [];
          const target = list.find((item) => item.id === messageId);
          if (target) { target.body = body; target.editedAt = editedAt; }
        });
      },
      deleteMessage: (roomId, messageId, at = Date.now()) => {
        set((state) => {
          const list = state.messages[roomId] ?? [];
          const target = list.find((item) => item.id === messageId);
          if (target) { target.body = ''; target.deletedAt = at; target.media = null; target.kind = 'text'; }
          if (state.pinnedMessages[roomId] === messageId) state.pinnedMessages[roomId] = null;
        });
        patchLocalHistory(roomId, messageId, { deleted: true, body: '' });
      },
      togglePinnedMessage: (roomId, messageId) => set((state) => {
        state.pinnedMessages[roomId] = state.pinnedMessages[roomId] === messageId ? null : messageId;
      }),
      markAllViewed: (roomId) => set((state) => {
        const list = state.messages[roomId] ?? [];
        list.forEach((item) => { item.viewed = true; });
        state.unread[roomId] = 0;
      }),
      markViewed: (roomId, messageId) => set((state) => {
        const list = state.messages[roomId] ?? [];
        const target = list.find((item) => item.id === messageId);
        if (target) target.viewed = true;
      }),
      markRoomOpened: (roomId) => set((state) => { state.unread[roomId] = 0; }),
      receiveWireMessage: async (roomId, wire) => {
        try {
          const did = get().currentDid;
          if (!did) return;
          const key = wire.encrypted ? await deriveRoomKey(roomId) : null;
          const plain = await decryptStoredWire(roomId, wire, key);
          get().ingestWireMessage(roomId, wire, plain, false);
        } catch (error) {
          console.error('Failed to process an incoming wire message', error);
        }
      },
      hydrateRoom: async (roomId) => {
        try {
          const did = get().currentDid;
          if (!did) return;
          const stored = loadLocalHistory(roomId);
          const key = await deriveRoomKey(roomId);
          const decrypted = await Promise.all(
            stored.map(async (wire) => {
              const plain = await decryptStoredWire(roomId, wire, key);
              return toVortexMessage(roomId, wire, plain, wire.senderDid === did.did);
            }),
          );
          set((state) => { state.messages[roomId] = decrypted.sort((a, b) => a.timestamp - b.timestamp); });
        } catch (error) {
          console.error('Failed to hydrate room', roomId, error);
        }
      },
      setPeers: (roomId, peers) => set((state) => { state.peers[roomId] = peers; }),
      setPeerProfile: (did, profile) => set((state) => { state.peerProfiles[did] = profile; }),
      addCall: (entry) => set((state) => {
        state.callHistory.unshift(entry);
        if (state.callHistory.length > 100) state.callHistory = state.callHistory.slice(0, 100);
      }),
      createGroup: (title, description, isPublic) => {
        const did = get().currentDid;
        if (!did) throw new Error('No DID');
        const groupId = 'group-' + crypto.randomUUID();
        const group: GroupChat = {
          id: groupId,
          title: title.trim(),
          description: description.trim(),
          avatarColor: get().profile.avatarColor,
          ownerDid: did.did,
          members: [{ did: did.did, role: 'owner', joinedAt: Date.now(), displayName: get().profile.displayName }],
          inviteLink: 'gotoap://join/' + groupId,
          createdAt: Date.now(),
          isPublic,
        };
        set((state) => {
          state.groups.push(group);
          state.activeRooms.unshift({ id: groupId, peerDid: null, title: group.title, pinned: false, muted: false, archived: false, createdAt: Date.now(), lastMessageAt: Date.now(), isGroup: true, isBot: false });
          sortRooms(state.activeRooms);
        });
        return groupId;
      },
      updateGroup: (groupId, patch) => set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (group) Object.assign(group, patch);
      }),
      deleteGroup: (groupId) => set((state) => {
        state.groups = state.groups.filter((g) => g.id !== groupId);
        state.activeRooms = state.activeRooms.filter((r) => r.id !== groupId);
      }),
      addGroupMember: (groupId, did, role = 'member') => set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (group && !group.members.find((m) => m.did === did)) {
          group.members.push({ did, role, joinedAt: Date.now() });
        }
      }),
      removeGroupMember: (groupId, did) => set((state) => {
        const group = state.groups.find((g) => g.id === groupId);
        if (group) group.members = group.members.filter((m) => m.did !== did);
      }),
      createBot: (name, username, description) => {
        const did = get().currentDid;
        if (!did) throw new Error('No DID');
        const botId = 'bot-' + crypto.randomUUID();
        const bot: BotInfo = {
          id: botId,
          name: name.trim(),
          username: username.trim().toLowerCase(),
          description: description.trim(),
          avatarColor: get().profile.avatarColor,
          ownerDid: did.did,
          commands: [],
          isPublic: false,
          createdAt: Date.now(),
        };
        set((state) => {
          state.bots.push(bot);
          state.activeRooms.unshift({ id: botId, peerDid: botId, title: bot.name, pinned: false, muted: false, archived: false, createdAt: Date.now(), lastMessageAt: Date.now(), isGroup: false, isBot: true });
          sortRooms(state.activeRooms);
        });
        return botId;
      },
      updateBot: (botId, patch) => set((state) => {
        const bot = state.bots.find((b) => b.id === botId);
        if (bot) Object.assign(bot, patch);
      }),
      deleteBot: (botId) => set((state) => {
        state.bots = state.bots.filter((b) => b.id !== botId);
        state.activeRooms = state.activeRooms.filter((r) => r.id !== botId);
      }),
    })),
    {
      name: 'gotoap-vortex',
      partialize: (state): PersistedVortexState => ({
        aiMode: state.aiMode,
        apiKey: state.apiKey,
        activeRooms: state.activeRooms,
        profile: state.profile,
        pinnedMessages: state.pinnedMessages,
        theme: state.theme,
        callHistory: state.callHistory,
        groups: state.groups,
        bots: state.bots,
        peerProfiles: state.peerProfiles,
      }),
    },
  ),
);
