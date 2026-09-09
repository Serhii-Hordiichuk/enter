/** Trystero setup over WebTorrent trackers. */
import type {
  JoinRoomConfig,
  MessageAction,
  Room,
} from '@trystero-p2p/core';

export type MessageKind = 'text' | 'sticker' | 'voice' | 'file';

export type PeerProfilePayload = {
  did: string;
  displayName?: string;
  bio?: string;
  colorId?: string;
};

/** Signaling payload for peer-to-peer audio/video calls. JSON-safe by design. */
export type JsonIceCandidate = { candidate: string; sdpMid?: string | null; sdpMLineIndex?: number | null; usernameFragment?: string | null };

export type CallSignal =
  | { type: 'offer'; sdp: string; video: boolean }
  | { type: 'answer'; sdp: string }
  | { type: 'ice'; candidate: JsonIceCandidate }
  | { type: 'hangup' };

/** A single unit sent over the P2P wire: chat message, typing ping, receipt, or profile. */
export type ChatWireMessage = {
  id: string;
  senderDid: string;
  body: string;
  timestamp: number;
  signature: string;
  encrypted: boolean;
  kind?: MessageKind;
  media?: { name: string; mime: string; size: number; dataUri: string; durationMs?: number };
  replyToId?: string;
  forwarded?: boolean;
  editOf?: string;
  editedAt?: number;
  deleted?: boolean;
  typing?: boolean;
  receiptIds?: string[];
  profile?: PeerProfilePayload;
  call?: CallSignal;
};

export interface GotoapRoomHandle {
  room: Room;
  messageAction: MessageAction<ChatWireMessage>;
  leave: () => Promise<void>;
}

const DEFAULT_TRACKER_URLS = ['wss://tracker.webtorrent.dev', 'wss://tracker.openwebtorrent.com', 'wss://tracker.btorrent.xyz'];

export const SAVED_MESSAGES_ROOM = 'saved-messages';

export function getAppId(): string {
  const configured = process.env.NEXT_PUBLIC_APP_ID;
  return configured && configured.trim().length > 0 ? configured.trim() : 'gotoap-chat';
}

export function getTrackerUrls(): string[] {
  const configured = process.env.NEXT_PUBLIC_TRACKERS;
  if (configured && configured.trim().length > 0) {
    const parsed = configured.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
    if (parsed.length > 0) return parsed;
  }
  return DEFAULT_TRACKER_URLS;
}

export function normalizeRoomId(roomId: string): string {
  const normalized = roomId.trim().toLowerCase().replace(/[^a-z0-9:_-]/g, '-').slice(0, 128);
  if (normalized.length < 3) throw new Error('Invalid room identifier');
  return normalized;
}

export async function createRoom(roomId: string): Promise<GotoapRoomHandle> {
  try {
    if (typeof window === 'undefined') throw new Error('Trystero is only available in the browser');
    const normalizedRoomId = normalizeRoomId(roomId);
    const { joinRoom } = await import('@trystero-p2p/torrent');
    const config: JoinRoomConfig = { appId: getAppId() };
    const room = joinRoom(config, normalizedRoomId);
    const messageAction = room.makeAction<ChatWireMessage>('gotoap-message');
    return { room, messageAction, leave: () => room.leave() };
  } catch (error) {
    console.error('Failed to create a trystero room:', error);
    throw error instanceof Error ? error : new Error('Failed to create a trystero room');
  }
}
