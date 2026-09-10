'use client';

/** Global search: find users, groups, bots, messages across the app and the P2P network. */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/profile/Avatar';
import { BotIcon, CheckIcon, CopyIcon, GroupIcon, MessageIcon, SearchIcon, UserIcon } from '@/components/icons';
import { directory, type DirectoryEntry } from '@/lib/p2p/discovery';
import { useVortexStore } from '@/lib/store/useVortexStore';
import { parseChatTarget } from '@/lib/p2p/trysteroSetup';

const norm = (v: string | undefined): string => (v ?? '').toLowerCase();
const wordsOf = (v: string): string[] => v.trim().toLowerCase().replace(/^@/, '').split(/\s+/).filter(Boolean);
const matchesAll = (haystack: string, q: string): boolean => wordsOf(q).every((word) => haystack.includes(word));

interface SearchResult {
  id: string;
  type: 'user' | 'group' | 'bot' | 'message';
  title: string;
  subtitle: string;
  avatarSeed: string;
  avatarName?: string;
  online?: boolean;
  roomId?: string;
  source: 'local' | 'network';
}

export function GlobalSearch({ onClose }: { onClose: () => void }): React.JSX.Element {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [networkResults, setNetworkResults] = useState<DirectoryEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [announced, setAnnounced] = useState(false);
  const profile = useVortexStore((state) => state.profile);
  const peerProfiles = useVortexStore((state) => state.peerProfiles);
  const groups = useVortexStore((state) => state.groups);
  const bots = useVortexStore((state) => state.bots);
  const rooms = useVortexStore((state) => state.activeRooms);
  const messages = useVortexStore((state) => state.messages);
  const startRoom = useVortexStore((state) => state.startRoom);

  // FIX-7: анонс профілю в мережу + heartbeat кожні 20с, поки відкритий пошук.
  // Інакше 3 пристрої, увімкнені в різний час, ніколи не бачать одне одного.
  useEffect(() => {
    if (announced) return;
    setAnnounced(true);
    void directory.announceSelf();
    void directory.startHeartbeat();
    const timer = window.setInterval(() => { void directory.startHeartbeat(); }, 20000);
    return () => window.clearInterval(timer);
  }, [announced]);

  // FIX-8: якщо юзер змінив @нік/ім’я — переанонсити одразу, а не чекати 60с.
  useEffect(() => {
    if (!announced) return;
    void directory.startHeartbeat();
  }, [announced, profile.username, profile.displayName, profile.bio]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setNetworkResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(() => {
      setNetworkResults([]);
      void directory.searchNetwork(q, (entries) => {
        setNetworkResults(entries);
        setSearching(false);
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const results = useMemo((): SearchResult[] => {
    const q = query.trim();
    if (q.length < 2) return [];
    const found: SearchResult[] = [];
    const seen = new Set<string>();

    // Поточний користувач: за ніком, ім’ям (не показуємо як "знайти себе" для чату)
    if (matchesAll(norm(profile.username) + ' ' + norm(profile.displayName), q)) {
      found.push({ id: 'me', type: 'user', title: profile.displayName || 'Ви', subtitle: profile.username ? '@' + profile.username + ' · це ви' : 'це ви', avatarSeed: 'me', avatarName: profile.displayName, online: true, source: 'local' });
      seen.add('me');
    }

    // Знайомі піри: нік + ім’я + DID + bio
    Object.values(peerProfiles).forEach((peer) => {
      if (seen.has(peer.did)) return;
      const hay = norm(peer.displayName) + ' ' + norm(peer.did) + ' ' + norm(peer.bio);
      if (matchesAll(hay, q)) {
        found.push({ id: peer.did, type: 'user', title: peer.displayName || peer.did.slice(0, 16), subtitle: peer.bio || peer.did, avatarSeed: peer.did, avatarName: peer.displayName, source: 'local' });
        seen.add(peer.did);
      }
    });

    // Групи: назва + опис
    groups.forEach((group) => {
      if (seen.has(group.id)) return;
      if (matchesAll(norm(group.title) + ' ' + norm(group.description), q)) {
        found.push({ id: group.id, type: 'group', title: group.title, subtitle: group.description || group.members.length + ' members', avatarSeed: group.id, avatarName: group.title, source: 'local' });
        seen.add(group.id);
      }
    });

    // Боти: ім’я + @username + опис
    bots.forEach((bot) => {
      if (seen.has(bot.id)) return;
      if (matchesAll(norm(bot.name) + ' ' + norm(bot.username) + ' ' + norm(bot.description), q)) {
        found.push({ id: bot.id, type: 'bot', title: bot.name, subtitle: (bot.username ? '@' + bot.username + ' · ' : '') + bot.commands.length + ' commands', avatarSeed: bot.id, avatarName: bot.name, source: 'local' });
        seen.add(bot.id);
      }
    });

    // Кімнати: id/назва
    rooms.forEach((room) => {
      if (seen.has(room.id) || room.id === 'saved-messages') return;
      if (matchesAll(norm(room.title) + ' ' + norm(room.id) + ' ' + norm(room.peerDid ?? ''), q)) {
        found.push({ id: room.id, type: 'user', title: room.title || room.id.slice(0, 20), subtitle: room.peerDid ?? room.id, avatarSeed: room.peerDid ?? room.id, avatarName: room.title || undefined, roomId: room.id, source: 'local' });
        seen.add(room.id);
      }
    });

    // Повідомлення
    Object.entries(messages).forEach(([roomId, list]) => {
      list.forEach((message) => {
        const key = message.id;
        if (seen.has(key)) return;
        if (message.kind === 'text' && matchesAll(norm(message.body), q)) {
          seen.add(key);
          found.push({ id: key, type: 'message', title: message.body.slice(0, 60), subtitle: 'in chat ' + roomId.slice(0, 20), avatarSeed: roomId, avatarName: undefined, roomId, source: 'local' });
        }
      });
    });

    // Мережа: нік + ім’я + DID + bio
    networkResults.forEach((entry) => {
      if (seen.has(entry.did)) return;
      seen.add(entry.did);
      const subtitle = entry.kind === 'user'
        ? ((entry.username ? '@' + entry.username + ' · ' : '') + (entry.bio || entry.did))
        : (entry.bio || entry.did);
      found.push({ id: entry.did, type: entry.kind === 'group' ? 'group' : entry.kind === 'bot' ? 'bot' : 'user', title: entry.name, subtitle, avatarSeed: entry.did, avatarName: entry.name, roomId: entry.roomId, source: 'network' });
    });

    return found;
  }, [query, profile.username, profile.displayName, peerProfiles, groups, bots, rooms, messages, networkResults]);

  const openDirectChat = (did: string): void => {
    try {
      const parsed = parseChatTarget(did);
      const roomId = startRoom(parsed.value, parsed.peerDid ?? did);
      router.push('/chat/' + encodeURIComponent(roomId));
      onClose();
    } catch { /* ignore */ }
  };

  const copyDid = (did: string): void => {
    try {
      void navigator.clipboard.writeText(did);
      setCopiedId(did);
      window.setTimeout(() => setCopiedId((current) => (current === did ? null : current)), 1500);
    } catch (error) {
      console.error('Failed to copy DID:', error);
    }
  };

  const quickConnectVisible = query.trim().length >= 3;

  const handleSelect = (result: SearchResult): void => {
    if (result.id === 'me') {
      onClose();
      return;
    }
    if (result.type === 'group') {
      router.push('/chat/' + encodeURIComponent(result.id));
    } else if (result.type === 'bot') {
      try { const roomId = startRoom(result.id, result.id); router.push('/chat/' + encodeURIComponent(roomId)); } catch { /* ignore */ }
    } else if (result.type === 'message' && result.roomId) {
      router.push('/chat/' + encodeURIComponent(result.roomId));
    } else if (result.type === 'user') {
      openDirectChat(result.roomId ?? result.id);
    }
    onClose();
  };

  const TypeIcon = ({ type }: { type: SearchResult['type'] }) => {
    if (type === 'group') return <GroupIcon size={14} className="text-gotoap-accent" />;
    if (type === 'bot') return <BotIcon size={14} className="text-gotoap-accent" />;
    if (type === 'message') return <MessageIcon size={14} className="text-gotoap-ink-muted" />;
    return <UserIcon size={14} className="text-gotoap-ink-muted" />;
  };

  const trimmed = query.trim();
  const showEmpty = trimmed.length >= 2 && results.length === 0 && !searching;
  const showHint = trimmed.length < 2;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-gotoap-bg" role="dialog" aria-label="Глобальний пошук">
      <div className="flex items-center gap-2 border-b border-gotoap-line bg-gotoap-panel px-3 py-2">
        <SearchIcon size={18} className="text-gotoap-ink-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="@нік, ім’я, DID, група, повідомлення..." autoFocus className="h-9 flex-1 bg-transparent text-sm text-gotoap-ink placeholder:text-gotoap-ink-faint focus:outline-none" />
        {query ? <button type="button" onClick={() => setQuery('')} className="text-xs text-gotoap-ink-muted hover:text-gotoap-ink">Очистити</button> : null}
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink">Закрити</button>
      </div>
      <div className="gotoap-scroll flex-1 overflow-y-auto p-2">
        {showHint ? (
          <div className="flex flex-col gap-2 px-2 py-4 text-sm text-gotoap-ink-muted">
            <p>Шукай за <b className="text-gotoap-ink">@ніком</b>, ім’ям, DID або текстом повідомлення.</p>
            <p className="text-xs">Порада: попроси друга назвати свій @нік — встав його сюди і тисни «Написати».</p>
          </div>
        ) : showEmpty ? (
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <p className="text-sm text-gotoap-ink-muted">{'Нічого не знайдено для "' + query + '"'}</p>
            {quickConnectVisible ? (
              <button type="button" onClick={() => openDirectChat(trimmed)} className="rounded-xl bg-gotoap-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
                Все одно написати: {trimmed.slice(0, 32)}
              </button>
            ) : null}
            <p className="max-w-xs text-xs text-gotoap-ink-faint">Якщо це @нік або DID — чат створиться одразу, без танців з бубном.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {searching && trimmed ? (
              <p className="flex items-center gap-2 px-2 py-2 text-xs text-gotoap-ink-faint">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-gotoap-accent border-t-transparent" aria-hidden="true" />
                {'Шукаю в P2P-мережі "' + trimmed + '"...'}
              </p>
            ) : null}
            {results.map((result) => (
              <div key={result.id + result.type} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-gotoap-hover">
                <button type="button" onClick={() => handleSelect(result)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <Avatar seed={result.avatarSeed} name={result.avatarName} size={44} online={result.online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <TypeIcon type={result.type} />
                      <p className="truncate text-sm font-medium text-gotoap-ink">{result.title}</p>
                      {result.source === 'network' ? <span className="shrink-0 rounded bg-gotoap-accent/15 px-1.5 text-[10px] font-medium uppercase text-gotoap-accent">мережа</span> : null}
                    </div>
                    <p className="truncate text-xs text-gotoap-ink-faint">{result.subtitle}</p>
                  </div>
                </button>
                {result.type === 'user' && result.id !== 'me' ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" title="Написати в 1 клік" onClick={() => openDirectChat(result.roomId ?? result.id)} className="rounded-lg bg-gotoap-accent px-2.5 py-1.5 text-xs font-medium text-white transition hover:opacity-90">
                      Написати
                    </button>
                    <button type="button" title="Скопіювати DID" onClick={() => copyDid(result.roomId ?? result.id)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">
                      {copiedId === (result.roomId ?? result.id) ? <CheckIcon size={14} className="text-emerald-400" /> : <CopyIcon size={14} />}
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
