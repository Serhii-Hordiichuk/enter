import type { VortexMessage } from '@/lib/store/useVortexStore';

interface MessageBubbleProps {
  message: VortexMessage;
}

export function MessageBubble({ message }: MessageBubbleProps): React.JSX.Element {
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return (
    <article className={'flex ' + (message.mine ? 'justify-end' : 'justify-start')}>
      <div className={'max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow ' + (message.mine ? 'rounded-br-md bg-indigo-600 text-white' : 'rounded-bl-md border border-zinc-800 bg-zinc-900 text-zinc-100')}>
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <footer className={'mt-1 flex items-center gap-2 text-[11px] ' + (message.mine ? 'text-indigo-100/80' : 'text-zinc-500')}>
          <span>{message.mine ? 'You' : message.senderDid.slice(0, 18) + '...'}</span>
          <span>-</span>
          <time dateTime={new Date(message.timestamp).toISOString()}>{time}</time>
          {message.encrypted ? <span title="Encrypted with AES-GCM">LOCKED</span> : null}
        </footer>
      </div>
    </article>
  );
}
