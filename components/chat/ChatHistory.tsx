'use client';

/** Scrollable message list with date separators, reactions, and jump-to-highlight support. */
import { useEffect, useMemo, useRef } from 'react';
import { MessageBubble, type MessageActionKind } from '@/components/chat/MessageBubble';
import { ChatMessageSkeleton } from '@/components/chat/ChatHistorySkeleton';
import type { VortexMessage } from '@/lib/store/useVortexStore';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface ChatHistoryProps {
  roomId: string;
  myDid: string;
  query?: string;
  highlightId?: string | null;
  onAction: (action: MessageActionKind, message: VortexMessage) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onLoadComplete?: () => void;
}

function dayLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function ChatHistory({ roomId, myDid, query, highlightId, onAction, onReaction, onLoadComplete }: ChatHistoryProps): React.JSX.Element {
  const messages = useVortexStore((state) => state.messages[roomId] ?? []);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchor = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef(new Map<string, HTMLDivElement>());

    useEffect(() => {
    bottomAnchor.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    onLoadComplete?.();
  }, [messages.length, onLoadComplete]);

  useEffect(() => {
    // Scroll to the bottom on mount
    bottomAnchor.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, []);

  useEffect(() => {
    if (!highlightId) return;
    const target = messageRefs.current.get(highlightId);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('gotoap-message-flash');
    const timer = window.setTimeout(() => target.classList.remove('gotoap-message-flash'), 1600);
    return () => window.clearTimeout(timer);
  }, [highlightId, messages.length]);

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
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <ChatMessageSkeleton />
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
                <div
                  key={message.id}
                  ref={(node) => { if (node) messageRefs.current.set(message.id, node); else messageRefs.current.delete(message.id); }}
                >
                  <MessageBubble key={message.id} message={message} replyTo={replyTo} myDid={myDid} query={query} highlighted={message.id === highlightId} onAction={onAction} onReaction={onReaction} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      <div ref={bottomAnchor} aria-hidden="true" />
    </div>
  );
}
