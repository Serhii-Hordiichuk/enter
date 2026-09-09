'use client';

import { useEffect, useRef } from 'react';
import { useRoomMessages } from '@/lib/store/useVortexStore';
import { MessageBubble } from './MessageBubble';

interface ChatHistoryProps {
  roomId: string;
}

export function ChatHistory({ roomId }: ChatHistoryProps): React.JSX.Element {
  const messages = useRoomMessages(roomId);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, roomId]);

  if (messages.length === 0) {
    return <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-zinc-500">Nothing here yet. Send the first message - it travels directly over WebRTC.</div>;
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto p-3">
      {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
      <div ref={endRef} />
    </div>
  );
}
