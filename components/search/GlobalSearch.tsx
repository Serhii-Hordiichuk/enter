'use client';

/** Global search: find users, groups, bots, messages across the app. */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/profile/Avatar';
import { BotIcon, GroupIcon, MessageIcon, SearchIcon, UserIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface SearchResult {
  id: string;
  type: 'user' | 'group' | 'bot' | 'message';
  title: string;
  subtitle: string;
  avatarSeed: string;
  avatarName?: string;
  online?: boolean;
  roomId?: string;
}

export function GlobalSearch({ onClose }: { onClose: () => void }): React.JSX.Element {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const profile = useVortexStore((state) => state.profile);
  const peerProfiles = useVortexStore((state) => state.peerProfiles);
  const groups = useVortexStore((state) => state.groups);
  const bots = useVortexStore((state) => state.bots);
  const rooms = useVortexStore((state) => state.activeRooms);
  const messages = useVortexStore((state) => state.messages);
  const startRoom = useVortexStore((state) => state.startRoom);

  const results = useMemo((): SearchResult[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const found: SearchResult[] = [];
    const seen = new Set<string>();

    // Search current user
    if (profile.username.toLowerCase().includes(q) || profile.displayName.toLowerCase().includes(q)) {
      found.push({ id: 'me', type: 'user', title: profile.displayName || 'You', subtitle: '@' + profile.username, avatarSeed: 'me', avatarName: profile.displayName, online: true });
      seen.add('me');
    }

    // Search peer profiles (users)
    Object.values(peerProfiles).forEach((peer) => {
      if (seen.has(peer.did)) return;
      if ((peer.displayName && peer.displayName.toLowerCase().includes(q)) || peer.did.toLowerCase().includes(q)) {
        found.push({ id: peer.did, type: 'user', title: peer.displayName || peer.did.slice(0, 16), subtitle: peer.bio || peer.did, avatarSeed: peer.did, avatarName: peer.displayName });
        seen.add(peer.did);
      }
    });

    // Search groups
    groups.forEach((group) => {
      if (seen.has(group.id)) return;
      if (group.title.toLowerCase().includes(q) || group.description.toLowerCase().includes(q)) {
        found.push({ id: group.id, type: 'group', title: group.title, subtitle: group.description || group.members.length + ' members', avatarSeed: group.id, avatarName: group.title });
        seen.add(group.id);
      }
    });

    // Search bots
    bots.forEach((bot) => {
      if (seen.has(bot.id)) return;
      if (bot.name.toLowerCase().includes(q) || bot.username.toLowerCase().includes(q) || bot.description.toLowerCase().includes(q)) {
        found.push({ id: bot.id, type: 'bot', title: bot.name, subtitle: '@' + bot.username, avatarSeed: bot.id, avatarName: bot.name });
        seen.add(bot.id);
      }
    });

    // Search messages
    Object.entries(messages).forEach(([, roomMessages]) => {
      roomMessages.forEach((message) => {
        if (seen.has(message.id)) return;
        if (message.body.toLowerCase().includes(q)) {
          const room = rooms.find((r) => r.id === message.roomId);
          found.push({ id: message.id, type: 'message', title: message.body.slice(0, 60), subtitle: (room?.title || 'Chat') + ' - ' + new Date(message.timestamp).toLocaleDateString('en-US'), avatarSeed: message.senderDid, online: false, roomId: message.roomId });
          seen.add(message.id);
        }
      });
    });

    return found.slice(0, 50);
  }, [query, profile, peerProfiles, groups, bots, messages, rooms]);

  const handleSelect = (result: SearchResult): void => {
    if (result.type === 'group') {
      router.push('/chat/' + encodeURIComponent(result.id));
    } else if (result.type === 'bot') {
      try { const roomId = startRoom(result.id, result.id); router.push('/chat/' + encodeURIComponent(roomId)); } catch { /* ignore */ }
    } else if (result.type === 'message' && result.roomId) {
      router.push('/chat/' + encodeURIComponent(result.roomId));
    } else if (result.type === 'user') {
      try { const roomId = startRoom(result.id, result.id); router.push('/chat/' + encodeURIComponent(roomId)); } catch { /* ignore */ }
    }
    onClose();
  };

  const TypeIcon = ({ type }: { type: SearchResult['type'] }) => {
    if (type === 'group') return <GroupIcon size={14} className="text-gotoap-accent" />;
    if (type === 'bot') return <BotIcon size={14} className="text-gotoap-accent" />;
    if (type === 'message') return <MessageIcon size={14} className="text-gotoap-ink-muted" />;
    return <UserIcon size={14} className="text-gotoap-ink-muted" />;
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-gotoap-bg" role="dialog" aria-label="Global search">
      <div className="flex items-center gap-2 border-b border-gotoap-line bg-gotoap-panel px-3 py-2">
        <SearchIcon size={18} className="text-gotoap-ink-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users, groups, bots, messages..." autoFocus className="h-9 flex-1 bg-transparent text-sm text-gotoap-ink placeholder:text-gotoap-ink-faint focus:outline-none" />
        {query ? <button type="button" onClick={() => setQuery('')} className="text-xs text-gotoap-ink-muted hover:text-gotoap-ink">Clear</button> : null}
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1.5 text-sm text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink">Close</button>
      </div>
      <div className="gotoap-scroll flex-1 overflow-y-auto p-2">
        {query && results.length === 0 ? (
          <p className="py-8 text-center text-sm text-gotoap-ink-muted">No results for "{query}"</p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {results.map((result) => (
              <button key={result.id + result.type} type="button" onClick={() => handleSelect(result)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-gotoap-hover">
                <Avatar seed={result.avatarSeed} name={result.avatarName} size={44} online={result.online} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <TypeIcon type={result.type} />
                    <p className="truncate text-sm font-medium text-gotoap-ink">{result.title}</p>
                  </div>
                  <p className="truncate text-xs text-gotoap-ink-faint">{result.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
