'use client';

/** Scrollable chat list with search filtering and an empty state. */
import { ChatsIcon } from '@/components/icons';
import { ChatListItem } from '@/components/chats/ChatListItem';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface ChatListProps {
  query: string;
  folder?: 'all' | 'personal' | 'groups' | 'bots' | 'unread';
}

export function ChatList({ query, folder = 'all' }: ChatListProps): React.JSX.Element {
  const activeRooms = useVortexStore((state) => state.activeRooms);
  const unread = useVortexStore((state) => state.unread);
  const normalized = query.trim().toLowerCase();
  const filtered = activeRooms.filter((room) => {
    if (room.archived) return false;
    if (folder === 'personal' && (room.isGroup || room.isBot)) return false;
    if (folder === 'groups' && !room.isGroup) return false;
    if (folder === 'bots' && !room.isBot) return false;
    if (folder === 'unread' && (unread[room.id] ?? 0) <= 0) return false;
    return (room.title || room.id).toLowerCase().includes(normalized);
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-6 text-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gotoap-hover text-gotoap-ink-muted">
          <ChatsIcon size={26} />
        </span>
        <p className="text-sm font-medium text-gotoap-ink">{query.trim() ? 'Нічого не знайдено' : 'Поки порожньо'}</p>
        <p className="text-xs text-gotoap-ink-muted">
          {query.trim() ? 'Спробуй @нік, частину DID або інше слово.' : 'Введи @нік друга в пошуку вище і тисни «Написати» — це 2 кліки.'}
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
