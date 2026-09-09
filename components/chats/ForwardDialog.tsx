'use client';

/** Dialog for forwarding a message into one of the existing chats. */
import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Avatar } from '@/components/profile/Avatar';
import { SearchIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface ForwardDialogProps {
  open: boolean;
  excludeRoomId: string | null;
  onClose: () => void;
  onForward: (roomId: string) => void;
}

function shortDid(did: string): string {
  return did.length > 18 ? did.slice(0, 15) + '...' : did;
}

export function ForwardDialog({ open, excludeRoomId, onClose, onForward }: ForwardDialogProps): React.JSX.Element | null {
  const rooms = useVortexStore((state) => state.activeRooms);
  const [query, setQuery] = useState('');
  if (!open) return null;
  const normalized = query.trim().toLowerCase();
  const candidates = rooms
    .filter((room) => room.id !== excludeRoomId)
    .filter((room) => (room.title || room.id).toLowerCase().includes(normalized));
  return (
    <Dialog open={open} title="Forward message" onClose={onClose}>
      <div className="relative mb-2">
        <SearchIcon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gotoap-ink-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search chats"
          aria-label="Search chats for forwarding"
          className="h-9 w-full rounded-full bg-gotoap-hover pl-9 pr-3 text-sm text-gotoap-ink placeholder:text-gotoap-ink-muted focus:bg-gotoap-bg focus:outline-none"
        />
      </div>
      <div className="gotoap-scroll max-h-64 overflow-y-auto">
        {candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-gotoap-ink-muted">No other chats yet</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {candidates.map((room) => (
              <li key={room.id}>
                <button
                  type="button"
                  onClick={() => { onForward(room.id); onClose(); }}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-gotoap-hover"
                >
                  <Avatar seed={room.peerDid ?? room.id} name={room.title || undefined} size={38} />
                  <span className="truncate text-sm text-gotoap-ink">{room.title || shortDid(room.peerDid ?? room.id)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  );
}
