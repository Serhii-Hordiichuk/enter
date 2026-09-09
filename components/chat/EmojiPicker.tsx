'use client';

/** Small emoji picker popover with a custom grid. */
import { useEffect, useRef, useState } from 'react';
import { SmileIcon } from '@/components/icons';

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
  disabled?: boolean;
}

const EMOJIS = [
  '😀', '😂', '🥲', '😊', '😍', '🤔', '😎', '🥳',
  '😴', '🙃', '😇', '🤝', '👍', '👎', '👏', '🙏',
  '🔥', '✨', '💬', '🔒', '⚡', '🚀', '🌐', '❤️',
] as const;

export function EmojiPicker({ onPick, disabled = false }: EmojiPickerProps): React.JSX.Element {
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
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Pick an emoji"
        title="Emoji"
        disabled={disabled}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink disabled:opacity-40"
      >
        <SmileIcon size={22} />
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-40 mb-2 w-64 rounded-2xl border border-gotoap-line bg-gotoap-panel p-2 shadow-2xl shadow-black/50">
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => { onPick(emoji); setOpen(false); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-lg transition hover:bg-gotoap-hover"
                aria-label={'Insert ' + emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
