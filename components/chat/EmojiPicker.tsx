'use client';

/** Lightweight custom emoji picker. */
import { useEffect, useRef, useState } from 'react';
import { SmileIcon } from '@/components/icons';

const EMOJI = ['😀', '😂', '🥲', '😊', '😍', '😉', '😎', '🤔', '😴', '🙄', '😭', '😡',
  '👍', '👎', '👏', '🙏', '🤝', '💪', '🔥', '✨', '🎉', '❤️', '💜', '💚',
  '🚀', '⚡', '🛡️', '🔒', '🔑', '🌐', '📎', '💬', '🤖', '👀', '🫡', '🤝'] as const;

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
}

export function EmojiPicker({ onPick }: EmojiPickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Pick an emoji" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">
        <SmileIcon size={20} />
      </button>
      {open ? (
        <div className="absolute bottom-full right-0 z-40 mb-2 w-72 rounded-2xl border border-gotoap-line bg-gotoap-panel p-2 shadow-2xl shadow-black/50">
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJI.map((emoji) => (
              <button key={emoji} type="button" onClick={() => onPick(emoji)} className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition hover:scale-110 hover:bg-gotoap-hover" aria-label={'Insert ' + emoji}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
