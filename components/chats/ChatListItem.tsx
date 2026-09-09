'use client';

/** A single row in the chat list, Telegram-style. */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar } from '@/components/profile/Avatar';
import { BellOffIcon, ImageIcon, PinIcon } from '@/components/icons';
import { useVortexStore, type ActiveRoom } from '@/lib/store/useVortexStore';

const EMPTY: [] = [];

interface ChatListItemProps {
  room: ActiveRoom;
  onOpenSharedMedia: (roomId: string) => void;
}

function shortDid(did: string): string {
  return did.length > 18 ? did.slice(0, 15) + '...' : did;
}

function formatChatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ChatListItem({ room, onOpenSharedMedia }: ChatListItemProps): React.JSX.Element {
  const pathname = usePathname();
  const messages = useVortexStore((state) => state.messages[room.id] ?? EMPTY);
  const peers = useVortexStore((state) => state.peers[room.id] ?? EMPTY);
  const active = pathname === '/chat/' + encodeURIComponent(room.id);
  const last = messages.length > 0 ? messages[messages.length - 1] : null;
  const title = room.title || (room.peerDid ? shortDid(room.peerDid) : shortDid(room.id));
  const preview = last ? (last.mine ? 'You: ' : '') + last.body.replace(/\s+/g, ' ').slice(0, 90) : 'No messages yet';

  return (
    <Link
      href={'/chat/' + encodeURIComponent(room.id)}
      className={'flex items-center gap-3 rounded-xl px-2.5 py-2 transition ' + (active ? 'bg-gotoap-active' : 'hover:bg-gotoap-hover')}
      aria-current={active ? 'page' : undefined}
    >
      <Avatar seed={room.peerDid ?? room.id} name={room.title || undefined} size={54} online={peers.length > 0} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={'truncate text-[15px] font-medium ' + (active ? 'text-white' : 'text-gotoap-ink')}>{title}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              aria-label="Shared media"
              title="Shared media"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenSharedMedia(room.id);
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gotoap-ink-muted opacity-0 transition hover:bg-gotoap-hover hover:text-gotoap-ink group-hover:opacity-100"
            >
              <ImageIcon size={15} />
            </button>
            <span className={'shrink-0 text-xs ' + (active ? 'text-white/70' : 'text-gotoap-ink-muted')}>{formatChatTime(last ? last.timestamp : room.lastMessageAt)}</span>
          </div>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          {room.pinned ? <PinIcon size={13} className={active ? 'shrink-0 text-white/70' : 'shrink-0 text-gotoap-ink-faint'} /> : null}
          {room.muted ? <BellOffIcon size={13} className={active ? 'shrink-0 text-white/70' : 'shrink-0 text-gotoap-ink-faint'} /> : null}
          <p className={'truncate text-[13px] ' + (active ? 'text-white/80' : 'text-gotoap-ink-muted')}>{preview}</p>
        </div>
      </div>
    </Link>
  );
}
