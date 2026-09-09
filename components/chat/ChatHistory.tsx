'use client';

/** Scrollable message list with date separators, reactions, and jump-to-highlight support. */
import { useEffect, useMemo, useRef } from 'react';
import { MessageBubble, type MessageActionKind } from '@/components/chat/MessageBubble';
import type { VortexMessage } from '@/lib/store/useVortexStore';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface ChatHistoryProps {
  roomId: string;
  myDid: string;
  query?: string;
  onAction: (action: MessageActionKind, message: VortexMessage) => void;
  onReaction: (messageId: string, emoji: string) => void;
}

function dayLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function ChatHistory({ roomId, myDid, query, onAction, onReaction }: ChatHistoryProps): React.JSX.Element {
  const messages = useVortexStore((state) => state.messages[roomId] ?? []);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchor = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const grouped = useMemo(() => {
    const byId = new Map(messages.map((message) => [message.id, message] as const));
    const sections: { day: string; items: { message: VortexMessage; replyTo: VortexMessage | null }[] }[] = [];
    for (const message of messages) {
      const day = dayLabel(message.timestamp);
      const last = sections[sections.length - 1];
      const replyTo = message.replyToId ? byId.get(message.replyToId) ?? null : null;
      const entry = { message, replyTo };
      if (last && last.day === day) last.items.push(entry);
      else sections.push({ day, items: [entry] });
    }
    return sections;
  }, [messages]);

  return (
    <div ref={scrollRef} className="gotoap-scroll relative flex-1 overflow-y-auto px-2 py-3 sm:px-6" aria-label="Message history">
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-gotoap-ink-muted">No messages here yet.</p>
          <p className="text-xs text-gotoap-ink-faint">Send a message to start the conversation. Both peers must be in this room.</p>
        </div>
      ) : (
        <div className="mx-auto flex max-w-3xl flex-col gap-1.5">
          {grouped.map((section) => (
            <div key={section.day} className="flex flex-col gap-1.5">
              <div className="sticky top-0 z-10 mx-auto my-2 w-fit rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm">
                {section.day}
              </div>
              {section.items.map(({ message, replyTo }) => (
                <MessageBubble key={message.id} message={message} replyTo={replyTo} myDid={myDid} query={query} onAction={onAction} onReaction={onReaction} />
              ))}
            </div>
          ))}
        </div>
      )}
      <div ref={bottomAnchor} aria-hidden="true" />
    </div>
  );
}
