'use client';

/** Right slide-over panel: chat profile, members, shared media, links, files. */
import { useMemo, useState } from 'react';
import { Avatar } from '@/components/profile/Avatar';
import { BellIcon, BellOffIcon, CloseIcon, FileIcon, GlobeIcon, ImageIcon, LinkIcon, SearchIcon, UserIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface ChatProfilePanelProps {
  roomId: string;
  onClose: () => void;
}

type Tab = 'members' | 'media' | 'files' | 'links';

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ChatProfilePanel({ roomId, onClose }: ChatProfilePanelProps): React.JSX.Element {
  const room = useVortexStore((state) => state.activeRooms.find((item) => item.id === roomId) ?? null);
  const messages = useVortexStore((state) => state.messages[roomId] ?? []);
  const peers = useVortexStore((state) => state.peers[roomId] ?? []);
  const peerProfiles = useVortexStore((state) => state.peerProfiles);
  const toggleRoomMuted = useVortexStore((state) => state.toggleRoomMuted);
  const [tab, setTab] = useState<Tab>('members');

  const media = useMemo(() => messages.filter((message) => message.media && message.media.mime.startsWith('image/')), [messages]);
  const files = useMemo(() => messages.filter((message) => message.media && !message.media.mime.startsWith('image/')), [messages]);
  const links = useMemo(() => messages.filter((message) => /https?:\/\/[^\s]+/.test(message.body)), [messages]);

  const peerName = room?.title || (room?.peerDid ? room.peerDid.slice(0, 20) + '...' : 'Peer');
  const peerBio = room?.peerDid ? peerProfiles[room.peerDid]?.bio : undefined;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'members', label: 'Members', icon: <UserIcon size={16} />, count: peers.length + 1 },
    { id: 'media', label: 'Media', icon: <ImageIcon size={16} />, count: media.length },
    { id: 'files', label: 'Files', icon: <FileIcon size={16} />, count: files.length },
    { id: 'links', label: 'Links', icon: <LinkIcon size={16} />, count: links.length },
  ];

  return (
    <aside className="absolute inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l border-gotoap-line bg-gotoap-panel shadow-2xl shadow-black/50 sm:w-80" aria-label="Chat profile panel">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-gotoap-line px-3">
        <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink"><CloseIcon size={18} /></button>
        <h2 className="flex-1 text-sm font-semibold text-gotoap-ink">Chat info</h2>
      </header>
      <div className="gotoap-scroll flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-2 px-4 py-5">
          <Avatar seed={room?.peerDid ?? roomId} name={peerName} size={80} online={peers.length > 0} />
          <h3 className="text-base font-semibold text-gotoap-ink">{peerName}</h3>
          <p className="text-xs text-gotoap-ink-muted">{peers.length > 0 ? 'online' : 'last seen recently'}</p>
          {peerBio ? <p className="mt-1 text-center text-xs text-gotoap-ink-faint">{peerBio}</p> : null}
        </div>
        <div className="flex items-center gap-2 border-b border-gotoap-line px-4">
          <button type="button" onClick={() => toggleRoomMuted(roomId)} className="flex flex-1 items-center justify-center gap-2 py-3 text-xs text-gotoap-ink-muted transition hover:text-gotoap-ink">
            {room?.muted ? <BellOffIcon size={15} /> : <BellIcon size={15} />}
            {room?.muted ? 'Unmute' : 'Mute'}
          </button>
          <button type="button" className="flex flex-1 items-center justify-center gap-2 py-3 text-xs text-gotoap-ink-muted transition hover:text-gotoap-ink"><SearchIcon size={15} /> Search</button>
        </div>
        <nav className="flex border-b border-gotoap-line" role="tablist">
          {tabs.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition ' + (tab === item.id ? 'border-b-2 border-gotoap-accent text-gotoap-accent' : 'text-gotoap-ink-muted hover:text-gotoap-ink')}>
              {item.icon}
              <span>{item.label}</span>
              {item.count > 0 ? <span className="text-[10px] opacity-60">({item.count})</span> : null}
            </button>
          ))}
        </nav>
        <div className="p-3">
          {tab === 'members' ? (
            <div className="flex flex-col gap-1">
              {peers.map((peer) => {
                const profile = peerProfiles[peer.peerId];
                return (
                  <div key={peer.peerId} className="flex items-center gap-3 rounded-xl px-2 py-2">
                    <Avatar seed={peer.peerId} name={profile?.displayName} size={40} online />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gotoap-ink">{profile?.displayName || peer.peerId.slice(0, 16)}</p>
                      <p className="truncate text-xs text-gotoap-ink-faint">{profile?.bio || 'online'}</p>
                    </div>
                  </div>
                );
              })}
              {peers.length === 0 ? <p className="py-4 text-center text-xs text-gotoap-ink-muted">No other members yet.</p> : null}
            </div>
          ) : tab === 'media' ? (
            media.length === 0 ? <p className="py-4 text-center text-xs text-gotoap-ink-muted">No media shared yet.</p> : (
              <div className="grid grid-cols-3 gap-1">
                {media.map((message) => (
                  <div key={message.id} className="aspect-square overflow-hidden rounded-lg bg-gotoap-hover">
                    {message.media ? <img src={message.media.dataUri} alt={message.media.name} className="h-full w-full object-cover" /> : null}
                  </div>
                ))}
              </div>
            )
          ) : tab === 'files' ? (
            files.length === 0 ? <p className="py-4 text-center text-xs text-gotoap-ink-muted">No files shared yet.</p> : (
              <div className="flex flex-col gap-1">
                {files.map((message) => (
                  <div key={message.id} className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-gotoap-hover">
                    <FileIcon size={18} className="shrink-0 text-gotoap-accent" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gotoap-ink">{message.media?.name ?? 'file'}</p>
                      <p className="text-[11px] text-gotoap-ink-faint">{formatDate(message.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : links.length === 0 ? <p className="py-4 text-center text-xs text-gotoap-ink-muted">No links shared yet.</p> : (
            <div className="flex flex-col gap-1">
              {links.map((message) => {
                const urlMatch = message.body.match(/https?:\/\/[^\s]+/);
                const url = urlMatch ? urlMatch[0] : '';
                return (
                  <div key={message.id} className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-gotoap-hover">
                    <GlobeIcon size={16} className="shrink-0 text-gotoap-accent" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-gotoap-accent">{url}</p>
                      <p className="text-[11px] text-gotoap-ink-faint">{formatDate(message.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
