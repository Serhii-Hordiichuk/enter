'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';

interface MessageInputProps {
  disabled?: boolean;
  onSend: (text: string) => Promise<void> | void;
}

export function MessageInput({ disabled = false, onSend }: MessageInputProps): React.JSX.Element {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const text = value.trim();
    if (!text || sending || disabled) return;
    setSending(true);
    setError(null);
    try {
      await onSend(text);
      setValue('');
    } catch (err) {
      console.error('Failed to send the message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send the message');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="border-t border-zinc-800 bg-zinc-950/80 p-3">
      {error ? <p className="mb-2 text-xs text-red-400">{error}</p> : null}
      <div className="flex gap-2">
        <input value={value} onChange={(event) => setValue(event.target.value)} disabled={disabled || sending} maxLength={4000} placeholder={disabled ? 'Create a DID first...' : 'Type a message...'} className="h-11 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none" />
        <Button type="submit" disabled={disabled || sending || value.trim().length === 0}>{sending ? '...' : 'Send'}</Button>
      </div>
    </form>
  );
}
