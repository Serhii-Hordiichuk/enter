'use client';

/** Scrollable chat list with search filtering and an empty state. */
import { ChatsIcon } from '@/components/icons';
import { ChatListItem } from '@/components/chats/ChatListItem';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface ChatListProps {
  query: string;
}

export function ChatList({ query }: ChatListProps): React.JSX.Element {
  const activeRooms = useVortexStore((state) => state.activeRooms);
  const normalized = query.trim().toLowerCase();
  const filtered = activeRooms.filter((room) => (room.title || room.id).toLowerCase().includes(normalized));

  if (filtered.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-6 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gotoap-hover text-gotoap-ink-muted">
          <ChatsIcon size={26} />
        </span>
        <p className="text-sm font-medium text-gotoap-ink">{query.trim() ? 'Nothing found' : 'No chats yet'}</p>
        <p className="text-xs text-gotoap-ink-muted">
          {query.trim() ? 'Try a different search query.' : 'Start a chat by sharing your DID or a room name with a peer.'}
        </p>
      </div>
    );
  }

  return (
    <nav className="gotoap-scroll flex-1 overflow-y-auto px-2 pb-3" aria-label="Chat list">
      <div className="flex flex-col gap-0.5">
        {filtered.map((room) => (
          <ChatListItem key={room.id} room={room} />
        ))}
      </div>
    </nav>
  );
}
