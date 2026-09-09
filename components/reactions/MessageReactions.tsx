'use client';

/** Message reactions: emoji reactions with counts and toggle. */
import { useState } from 'react';
import type { VortexMessage } from '@/lib/store/useVortexStore';

interface MessageReactionsProps {
  message: VortexMessage;
  myDid: string;
  onToggle: (messageId: string, emoji: string) => void;
}

const QUICK_REACTIONS = ['❤️', '👍', '👎', '😂', '😮', '😢', '🔥'];

export function MessageReactions({ message, myDid, onToggle }: MessageReactionsProps): React.JSX.Element {
  const [pickerOpen, setPickerOpen] = useState(false);
  const reactions = message.reactions ?? [];

  return (
    <div className="relative mt-1 flex flex-wrap items-center gap-1">
      {reactions.map((reaction) => {
        const mine = reaction.peers.includes(myDid);
        const count = reaction.peers.length;
        return (
          <button
            key={reaction.emoji}
            type="button"
            onClick={() => onToggle(message.id, reaction.emoji)}
            aria-label={'React with ' + reaction.emoji}
            className={
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ' +
              (mine
                ? 'border-gotoap-accent bg-gotoap-accent/20 text-gotoap-accent'
                : 'border-gotoap-line bg-gotoap-hover text-gotoap-ink-muted hover:bg-gotoap-active')
            }
          >
            <span>{reaction.emoji}</span>
            <span className="font-medium">{count}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => setPickerOpen((value) => !value)}
        aria-label="Add reaction"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-gotoap-ink-faint transition hover:bg-gotoap-hover hover:text-gotoap-ink"
      >
        <span aria-hidden="true">＋</span>
      </button>
      {pickerOpen ? (
        <div className="absolute bottom-full left-0 z-30 mb-1 flex gap-1 rounded-full border border-gotoap-line bg-gotoap-panel p-1 shadow-xl">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => { onToggle(message.id, emoji); setPickerOpen(false); }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-base transition hover:scale-125 hover:bg-gotoap-hover"
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
