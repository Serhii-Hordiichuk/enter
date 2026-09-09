'use client';

/** A single chat message bubble, Telegram-like. */
import { Avatar } from '@/components/profile/Avatar';
import { DoubleCheckIcon, LockIcon } from '@/components/icons';
import type { VortexMessage } from '@/lib/store/useVortexStore';

interface MessageBubbleProps {
  message: VortexMessage;
}

function shortDid(did: string): string {
  return did.length > 14 ? did.slice(0, 11) + '...' : did;
}

export function MessageBubble({ message }: MessageBubbleProps): React.JSX.Element {
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const mine = message.mine;
  return (
    <article className={'flex items-end gap-2 ' + (mine ? 'justify-end' : 'justify-start')}>
      {!mine ? <Avatar seed={message.senderDid} size={28} /> : null}
      <div
        className={
          'max-w-[78%] rounded-2xl px-3 py-1.5 text-[15px] leading-snug shadow-md shadow-black/20 ' +
          (mine ? 'rounded-br-md bg-gotoap-bubble-out text-white' : 'rounded-bl-md bg-gotoap-bubble-in text-gotoap-ink')
        }
      >
        {!mine ? <p className="mb-0.5 text-xs font-semibold text-gotoap-accent-muted">{shortDid(message.senderDid)}</p> : null}
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <footer className={'mt-0.5 flex items-center justify-end gap-1 text-[11px] ' + (mine ? 'text-white/60' : 'text-gotoap-ink-faint')}>
          {message.encrypted ? <span title="Encrypted with AES-GCM"><LockIcon size={11} /></span> : null}
          <time dateTime={new Date(message.timestamp).toISOString()}>{time}</time>
          {mine ? <DoubleCheckIcon size={13} className="text-white/80" /> : null}
        </footer>
      </div>
    </article>
  );
}
