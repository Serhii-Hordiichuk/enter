'use client';

/** Archive: chats that have been archived by the user. */
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/profile/Avatar';
import { ArchiveIcon, UnarchiveIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';

function formatChatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function shortDid(did: string): string {
  return did.length > 18 ? did.slice(0, 15) + '...' : did;
}

export function ArchiveList(): React.JSX.Element {
  const router = useRouter();
  const activeRooms = useVortexStore((state) => state.activeRooms);
  const messages = useVortexStore((state) => state.messages);
  const peers = useVortexStore((state) => state.peers);
  const toggleRoomArchived = useVortexStore((state) => state.toggleRoomArchived);

  const archivedRooms = useMemo(() => activeRooms.filter((room) => room.archived), [activeRooms]);

  if (archivedRooms.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gotoap-hover text-gotoap-ink-muted">
          <ArchiveIcon size={32} />
        </span>
        <p className="text-sm font-medium text-gotoap-ink">Archive is empty</p>
        <p className="max-w-xs text-xs text-gotoap-ink-muted">Archived chats will appear here. Long-press a chat to archive it.</p>
      </div>
    );
  }

  return (
    <nav className="gotoap-scroll flex-1 overflow-y-auto px-2 pb-3" aria-label="Archived chats">
      <div className="flex flex-col gap-0.5">
        {archivedRooms.map((room) => {
          const roomMessages = messages[room.id] ?? [];
          const last = roomMessages.length > 0 ? roomMessages[roomMessages.length - 1] : null;
          const title = room.title || (room.peerDid ? shortDid(room.peerDid) : shortDid(room.id));
          const roomPeers = peers[room.id] ?? [];
          return (
            <div key={room.id} className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-gotoap-hover">
              <Avatar seed={room.peerDid ?? room.id} name={room.title || undefined} size={54} online={roomPeers.length > 0} />
              <button type="button" onClick={() => router.push('/chat/' + encodeURIComponent(room.id))} className="min-w-0 flex-1 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[15px] font-medium text-gotoap-ink">{title}</span>
                  <span className="shrink-0 text-xs text-gotoap-ink-muted">{formatChatTime(last ? last.timestamp : room.lastMessageAt)}</span>
                </div>
                <p className="truncate text-[13px] text-gotoap-ink-muted">{last ? (last.mine ? 'You: ' : '') + last.body.replace(/\s+/g, ' ').slice(0, 90) : 'No messages yet'}</p>
              </button>
              <button type="button" onClick={() => toggleRoomArchived(room.id)} aria-label="Unarchive chat" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">
                <UnarchiveIcon size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
