/** P2P directory and nickname search over a shared trystero room.
 *
 * Every peer announces its profile (name, @username, DID, bio) into a global
 * discovery room. A search broadcasts a bounded ping; reachable peers reply
 * with matching directory entries (their own plus relayed announcements).
 * No server and no database are involved — only WebRTC data channels.
 */
import type { MessageAction } from '@trystero-p2p/core';
import { getAppId } from './trysteroSetup';

export type DirectoryEntryKind = 'user' | 'group' | 'bot';

export type DirectoryEntry = {
  did: string;
  kind: DirectoryEntryKind;
  name: string;
  username?: string;
  bio?: string;
  colorId?: string;
  roomId?: string;
  lastSeen: number;
};

export type DirectoryPayload =
  | { kind: 'announce'; entry: DirectoryEntry }
  | { kind: 'ping'; requestId: string; requesterDid: string; query: string; ttl: number }
  | { kind: 'pong'; requestId: string; responderDid: string; entries: DirectoryEntry[] };

const DISCOVERY_ROOM_SUFFIX = ':directory';
const PING_TTL = 2;
const SEARCH_TIMEOUT_MS = 4000;
const ANNOUNCE_INTERVAL_MS = 60000;

interface PendingSearch {
  results: Map<string, DirectoryEntry>;
  timer: number;
  onResults: (entries: DirectoryEntry[]) => void;
}

interface DirectoryRoomHandle {
  messageAction: MessageAction<DirectoryPayload>;
  leave: () => Promise<void>;
}

class DirectoryService {
  private handle: DirectoryRoomHandle | null = null;
  private announced = false;
  private announceTimer: number | null = null;
  private cache: DirectoryEntry[] = [];
  private readonly cacheKey = 'gotoap-directory-cache-v1';
  private pending = new Map<string, PendingSearch>();
  private seen = new Set<string>();

  constructor() {
    this.loadCache();
  }

  private loadCache(): void {
    try {
      const raw = window.localStorage.getItem(this.cacheKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as DirectoryEntry[];
      if (Array.isArray(parsed)) this.cache = parsed.filter((e) => e && typeof e.did === 'string').slice(-200);
    } catch {
      this.cache = [];
    }
  }

  /** Returns every cached directory entry (users/groups/bots we have discovered). */
  getCached(): DirectoryEntry[] {
    return this.cache;
  }

  /** Lazily joins the discovery room, once per browser session. */
  async ensureRoom(): Promise<DirectoryRoomHandle> {
    if (this.handle) return this.handle;
    const roomId = getAppId() + DISCOVERY_ROOM_SUFFIX;
    const { joinRoom } = await import('@trystero-p2p/torrent');
    const room = joinRoom({ appId: getAppId() }, roomId);
    const messageAction = room.makeAction<DirectoryPayload>('gotoap-directory-message');
    const handle: DirectoryRoomHandle = { messageAction, leave: () => room.leave() };
    messageAction.onMessage = (payload: DirectoryPayload) => {
      try {
        this.onDirectoryMessage(payload);
      } catch (error) {
        console.error('Directory message handler error:', error);
      }
    };
    this.handle = handle;
    return handle;
  }

  /** Announces (periodically) the local profile into the network. */
  async announce(entry: DirectoryEntry): Promise<void> {
    try {
      const handle = await this.ensureRoom();
      if (this.announceTimer !== null) window.clearTimeout(this.announceTimer);
      this.announceTimer = window.setTimeout(() => void this.announce(entry), ANNOUNCE_INTERVAL_MS);
      if (!this.announced) {
        this.announced = true;
        await handle.messageAction.send({ kind: 'announce', entry });
      }
    } catch (error) {
      console.error('Failed to announce the profile:', error);
    }
  }

  /** Announces the local profile built from the DID wallet (idempotent per session). */
  async announceSelf(): Promise<void> {
    const entry = this.localEntry();
    if (!entry) return;
    await this.announce(entry);
  }

  /** Searches the P2P network by name/username/DID. Streams live results and merges the cache. */
  async searchNetwork(query: string, onResults: (entries: DirectoryEntry[]) => void): Promise<void> {
    const q = query.trim().toLowerCase();
    if (!q) {
      onResults([]);
      return;
    }
    if (this.pending.size >= 3) {
      onResults(this.filterCached(q));
      return;
    }
    try {
      const handle = await this.ensureRoom();
      const requestId = crypto.randomUUID();
      const requestorDid = this.myDid();
      if (!requestorDid) {
        onResults(this.filterCached(q));
        return;
      }
      const search: PendingSearch = {
        results: new Map<string, DirectoryEntry>(),
        timer: window.setTimeout(() => {
          this.pending.delete(requestId);
          this.seen.delete('ping:' + requestId);
          this.mergeCache(Array.from(search.results.values()));
          onResults(this.filterCached(q));
        }, SEARCH_TIMEOUT_MS),
        onResults: (entries: DirectoryEntry[]) => {
          for (const entry of entries) {
            if (entry && entry.did && matchesQuery(entry, q)) search.results.set(entry.did, entry);
          }
        },
      };
      this.pending.set(requestId, search);
      await handle.messageAction.send({ kind: 'ping', requestId, requesterDid: requestorDid, query: q, ttl: PING_TTL });
    } catch (error) {
      console.error('Network search failed:', error);
      onResults(this.filterCached(q));
    }
  }

  private filterCached(q: string): DirectoryEntry[] {
    return this.cache.filter((entry) => matchesQuery(entry, q)).sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 25);
  }

  private mergeCache(entries: DirectoryEntry[]): void {
    const byDid = new Map<string, DirectoryEntry>();
    for (const entry of this.cache) byDid.set(entry.did, entry);
    let changed = false;
    for (const entry of entries) {
      if (!entry || !entry.did) continue;
      const previous = byDid.get(entry.did);
      if (!previous || entry.lastSeen > previous.lastSeen) {
        byDid.set(entry.did, entry);
        changed = true;
      }
    }
    if (changed) {
      this.cache = Array.from(byDid.values()).sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 200);
      try {
        window.localStorage.setItem(this.cacheKey, JSON.stringify(this.cache));
      } catch (error) {
        console.error('Failed to persist the directory cache:', error);
      }
    }
  }

  private myDid(): string | null {
    try {
      const raw = window.localStorage.getItem('gotoap-did');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { did?: string };
      return typeof parsed.did === 'string' ? parsed.did : null;
    } catch {
      return null;
    }
  }

  private onDirectoryMessage(payload: DirectoryPayload): void {
    if (payload.kind === 'announce') {
      this.mergeCache([payload.entry]);
      return;
    }
    if (payload.kind === 'ping') {
      this.handlePing(payload);
      return;
    }
    this.handlePong(payload);
  }

  private handlePing(ping: Extract<DirectoryPayload, { kind: 'ping' }>): void {
    const seenKey = 'ping:' + ping.requestId;
    if (this.seen.has(seenKey)) return;
    this.seen.add(seenKey);
    if (ping.requesterDid === this.myDid()) return;
    const handle = this.handle;
    if (!handle) return;
    const mine = this.filterCached(ping.query);
    const myEntry = this.localEntry();
    if (myEntry && matchesQuery(myEntry, ping.query)) mine.unshift(myEntry);
    if (mine.length > 0) {
      void handle.messageAction.send({ kind: 'pong', requestId: ping.requestId, responderDid: ping.requesterDid, entries: mine.slice(0, 10) } satisfies DirectoryPayload);
    }
    if (ping.ttl > 0) {
      window.setTimeout(() => {
        void handle.messageAction.send({ kind: 'ping', requestId: ping.requestId, requesterDid: ping.requesterDid, query: ping.query, ttl: ping.ttl - 1 } satisfies DirectoryPayload);
      }, 150 + Math.floor(Math.random() * 350));
    }
  }

  private handlePong(pong: Extract<DirectoryPayload, { kind: 'pong' }>): void {
    const search = this.pending.get(pong.requestId);
    if (!search) return;
    const seenKey = 'pong:' + pong.requestId + ':' + pong.responderDid;
    if (this.seen.has(seenKey)) return;
    this.seen.add(seenKey);
    search.onResults(pong.entries);
  }

  private localEntry(): DirectoryEntry | null {
    try {
      const rawDid = window.localStorage.getItem('gotoap-did');
      if (!rawDid) return null;
      const parsedDid = JSON.parse(rawDid) as { did?: string };
      if (typeof parsedDid.did !== 'string') return null;
      const rawStore = window.localStorage.getItem('gotoap-vortex');
      let profile: { displayName?: string; username?: string; bio?: string; avatarColor?: string } | null = null;
      if (rawStore) {
        try {
          const parsed = JSON.parse(rawStore) as { state?: { profile?: { displayName?: string; username?: string; bio?: string; avatarColor?: string } } };
          profile = parsed.state?.profile ?? null;
        } catch {
          profile = null;
        }
      }
      return {
        did: parsedDid.did,
        kind: 'user',
        name: profile?.displayName?.trim() || parsedDid.did.slice(0, 12),
        username: profile?.username?.trim(),
        bio: profile?.bio?.trim(),
        colorId: profile?.avatarColor,
        lastSeen: Date.now(),
      } satisfies DirectoryEntry;
    } catch {
      return null;
    }
  }
}

function matchesQuery(entry: DirectoryEntry, q: string): boolean {
  const query = q.trim().toLowerCase().replace(/^@/, '');
  if (!query) return false;
  const haystack = [entry.name, entry.username, entry.did, entry.bio].filter(Boolean).join(' ').toLowerCase();
  // Підтримка пошуку за частиною ніка / DID / імені: кожне слово запиту має зустрічатись
  return query.split(/\s+/).every((word) => haystack.includes(word));
}

export const directory = new DirectoryService();
