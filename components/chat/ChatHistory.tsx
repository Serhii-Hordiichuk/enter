'use client';

/** Scrollable message history with date separators, on the chat wallpaper. */
import { useEffect, useRef } from 'react';
import { ChatsIcon, LockIcon } from '@/components/icons';
import { useRoomMessages } from '@/lib/store/useVortexStore';
import { MessageBubble } from './MessageBubble';

interface ChatHistoryProps {
  roomId: string;
}

function dayLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86_400_000);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function ChatHistory({ roomId }: ChatHistoryProps): React.JSX.Element {
  const messages = useRoomMessages(roomId);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, roomId]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gotoap-panel text-gotoap-ink-muted">
          <ChatsIcon size={30} />
        </span>
        <p className="text-sm font-medium text-gotoap-ink">No messages here yet</p>
        <p className="flex items-center gap-1.5 text-xs text-gotoap-ink-muted">
          <LockIcon size={12} />
          Send the first message - it travels directly over WebRTC.
        </p>
      </div>
    );
  }

  return (
    <div className="gotoap-scroll gotoap-chat-bg flex-1 overflow-y-auto px-3 py-4 sm:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
        {messages.map((message, index) => {
          const previous = index > 0 ? messages[index - 1] : null;
          const newDay = !previous || new Date(previous.timestamp).toDateString() !== new Date(message.timestamp).toDateString();
          return (
            <div key={message.id} className="flex flex-col gap-1.5">
              {newDay ? (
                <div className="my-2 flex justify-center">
                  <span className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white/70">{dayLabel(message.timestamp)}</span>
                </div>
              ) : null}
              <MessageBubble message={message} />
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
