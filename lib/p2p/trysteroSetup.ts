/** Ініціалізація trystero через WebTorrent-трекери. */
import type {
  DataPayload,
  JoinRoomConfig,
  MessageAction,
  Room,
} from '@trystero-p2p/core';

export interface GotoapRoomHandle {
  room: Room;
  messageAction: MessageAction<ChatWireMessage>;
  leave: () => Promise<void>;
}

export type ChatWireMessage = DataPayload & {
  id: string;
  senderDid: string;
  body: string;
  timestamp: number;
  signature: string;
  encrypted: boolean;
};

const DEFAULT_TRACKER_URLS = ['wss://tracker.webtorrent.dev', 'wss://tracker.openwebtorrent.com', 'wss://tracker.btorrent.xyz'];

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
  if (normalized.length < 3) throw new Error('Некоректний ідентифікатор кімнати');
  return normalized;
}

export async function createRoom(roomId: string): Promise<GotoapRoomHandle> {
  try {
    if (typeof window === 'undefined') throw new Error('Trystero доступний лише у браузері');
    const normalizedRoomId = normalizeRoomId(roomId);
    const { joinRoom } = await import('@trystero-p2p/torrent');
    const config: JoinRoomConfig = { appId: getAppId() };
    const room = joinRoom(config, normalizedRoomId);
    const messageAction = room.makeAction<ChatWireMessage>('gotoap-message');
    return { room, messageAction, leave: () => room.leave() };
  } catch (error) {
    console.error('Не вдалося створити trystero-кімнату:', error);
    throw error instanceof Error ? error : new Error('Не вдалося створити trystero-кімнату');
  }
}
