'use client';

/** Telegram-style composer: emoji picker, auto-growing textarea, send button. */
import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { ClipIcon, MicIcon, SendIcon } from '@/components/icons';

interface MessageInputProps {
  disabled?: boolean;
  onSend: (text: string) => Promise<void> | void;
}

export function MessageInput({ disabled = false, onSend }: MessageInputProps): React.JSX.Element {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const blocked = disabled || sending;
  const canSend = value.trim().length > 0 && !blocked;

  const resize = (): void => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = Math.min(element.scrollHeight, 140) + 'px';
  };

  const send = async (): Promise<void> => {
    const text = value.trim();
    if (!text || sending || disabled) return;
    setSending(true);
    setError(null);
    try {
      await onSend(text);
      setValue('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    } catch (err) {
      console.error('Failed to send the message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send the message');
    } finally {
      setSending(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void send();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <form onSubmit={submit} className="border-t border-gotoap-line bg-gotoap-panel px-2.5 py-2">
      {error ? <p className="mb-1.5 px-1 text-xs text-red-400">{error}</p> : null}
      <div className="flex items-end gap-1">
        <button
          type="button"
          aria-label="Attach a file"
          title="Attach a file (coming soon)"
          disabled={blocked}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink disabled:opacity-40"
        >
          <ClipIcon size={21} />
        </button>
        <EmojiPicker onPick={(emoji) => setValue((current) => current + emoji)} disabled={blocked} />
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => { setValue(event.target.value); resize(); }}
          onKeyDown={onKeyDown}
          rows={1}
          disabled={blocked}
          maxLength={4000}
          aria-label="Message"
          placeholder={disabled ? 'Create a DID first...' : 'Write a message...'}
          className="gotoap-textarea min-h-[40px] flex-1 rounded-2xl bg-gotoap-hover px-3.5 py-2.5 text-[15px] text-gotoap-ink placeholder:text-gotoap-ink-muted focus:bg-gotoap-bg focus:outline-none focus:ring-1 focus:ring-gotoap-accent/50 disabled:opacity-60"
        />
        {canSend ? (
          <button
            type="submit"
            aria-label="Send message"
            title="Send"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gotoap-accent text-white transition hover:bg-gotoap-accent-hover"
          >
            <SendIcon size={19} />
          </button>
        ) : (
          <button
            type="button"
            aria-label="Voice message (coming soon)"
            title="Voice message (coming soon)"
            disabled={blocked}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink disabled:opacity-40"
          >
            <MicIcon size={20} />
          </button>
        )}
      </div>
    </form>
  );
}
