/** Історія чату у WebTorrent: локальне сховище + сідер JSON-файлу. */
import type { ChatWireMessage } from './trysteroSetup';

export interface TorrentHistorySnapshot { roomId: string; magnetURI: string | null; messages: ChatWireMessage[]; updatedAt: number; }
export interface WebTorrentClientLike { seed: (file: File, opts: Record<string, string>, onSeed: (torrent: { magnetURI: string }) => void) => void; destroy: () => void; }

const HISTORY_PREFIX = 'gotoap.history.v1.';
const SNAPSHOT_LIMIT = 500;

export function historyStorageKey(roomId: string): string { return HISTORY_PREFIX + roomId; }

export function loadLocalHistory(roomId: string): ChatWireMessage[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(historyStorageKey(roomId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatWireMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item?.id === 'string' && typeof item?.body === 'string').slice(-SNAPSHOT_LIMIT);
  } catch (error) {
    console.error('Не вдалося прочитати локальну історію:', error);
    return [];
  }
}

export function saveLocalHistory(roomId: string, messages: ChatWireMessage[]): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(historyStorageKey(roomId), JSON.stringify(messages.slice(-SNAPSHOT_LIMIT)));
  } catch (error) {
    console.error('Не вдалося зберегти локальну історію:', error);
  }
}

export function mergeHistory(current: ChatWireMessage[], incoming: ChatWireMessage): ChatWireMessage[] {
  if (current.some((item) => item.id === incoming.id)) return current;
  return [...current, incoming].sort((a, b) => a.timestamp - b.timestamp).slice(-SNAPSHOT_LIMIT);
}

export class TorrentHistoryManager {
  private client: WebTorrentClientLike | null = null;
  private magnetByRoom = new Map<string, string>();
  private clientPromise: Promise<WebTorrentClientLike> | null = null;

  getMagnet(roomId: string): string | null { return this.magnetByRoom.get(roomId) ?? null; }

  private loadClient(): Promise<WebTorrentClientLike> {
    if (this.client) return Promise.resolve(this.client);
    if (!this.clientPromise) {
      this.clientPromise = import('webtorrent').then((module) => {
        const Constructor = (module as unknown as { default: new () => WebTorrentClientLike }).default;
        this.client = new Constructor();
        return this.client;
      }).catch((error) => { this.clientPromise = null; console.error('Не вдалося ініціалізувати WebTorrent:', error); throw error instanceof Error ? error : new Error('WebTorrent недоступний'); });
    }
    return this.clientPromise;
  }

  async seed(roomId: string, messages: ChatWireMessage[]): Promise<string> {
    try {
      const client = await this.loadClient();
      const payload = JSON.stringify({ roomId, exportedAt: new Date().toISOString(), messages: messages.slice(-SNAPSHOT_LIMIT) });
      const file = new File([payload], 'gotoap-history-' + roomId + '.json', { type: 'application/json' });
      const magnetURI = await new Promise<string>((resolve, reject) => {
        try { client.seed(file, { name: 'gotoap-history-' + roomId }, (torrent) => resolve(torrent.magnetURI)); }
        catch (error) { reject(error instanceof Error ? error : new Error('Не вдалося створити торрент')); }
      });
      this.magnetByRoom.set(roomId, magnetURI);
      return magnetURI;
    } catch (error) {
      console.error('Не вдалося засідерувати історію:', error);
      throw error instanceof Error ? error : new Error('Не вдалося засідерувати історію');
    }
  }

  destroy(): void {
    try { this.client?.destroy(); } catch (error) { console.error('Помилка зупинки WebTorrent:', error); }
    this.client = null;
    this.clientPromise = null;
    this.magnetByRoom.clear();
  }
}

export const torrentHistory = new TorrentHistoryManager();
