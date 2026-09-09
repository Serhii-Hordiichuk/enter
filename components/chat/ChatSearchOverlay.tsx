'use client';

/** In-chat message search overlay with jump-to-message support. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackIcon, CloseIcon, SearchIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface ChatSearchOverlayProps {
  roomId: string;
  onJumpTo: (messageId: string) => void;
  onClose: () => void;
}

export function ChatSearchOverlay({ roomId, onJumpTo, onClose }: ChatSearchOverlayProps): React.JSX.Element {
  const messages = useVortexStore((state) => state.messages[roomId] ?? []);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return messages.filter((message) => message.body.toLowerCase().includes(normalized)).slice(-50).reverse();
  }, [messages, query]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-gotoap-bg/95 backdrop-blur-sm" role="dialog" aria-label="Search in chat">
      <div className="flex items-center gap-2 border-b border-gotoap-line bg-gotoap-panel px-2 py-2 sm:px-4">
        <button type="button" onClick={onClose} aria-label="Close the search" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">
          <BackIcon size={20} />
        </button>
        <div className="relative flex-1">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gotoap-ink-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search in this chat"
            className="h-9 w-full rounded-full bg-gotoap-hover pl-9 pr-8 text-sm text-gotoap-ink placeholder:text-gotoap-ink-muted focus:bg-gotoap-bg focus:outline-none focus:ring-1 focus:ring-gotoap-accent/50"
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear the query" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gotoap-ink-muted hover:text-gotoap-ink">
              <CloseIcon size={13} />
            </button>
          ) : null}
        </div>
      </div>
      <div className="gotoap-scroll flex-1 overflow-y-auto p-3">
        {results.length === 0 ? (
          <p className="mt-8 text-center text-sm text-gotoap-ink-muted">{query.trim() ? 'Nothing found' : 'Type to search messages'}</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {results.map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  onClick={() => { onJumpTo(message.id); onClose(); }}
                  className="w-full rounded-xl bg-gotoap-panel px-3 py-2 text-left transition hover:bg-gotoap-hover"
                >
                  <span className="block text-[11px] text-gotoap-ink-faint">{new Date(message.timestamp).toLocaleString('en-US')} - {message.mine ? 'You' : 'Peer'}</span>
                  <span className="line-clamp-2 text-sm text-gotoap-ink">{message.body.slice(0, 160)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
