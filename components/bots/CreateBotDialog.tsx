'use client';
import { useState, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useVortexStore } from '@/lib/store/useVortexStore';

export function CreateBotDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (botId: string) => void }): React.JSX.Element | null {
  const createBot = useVortexStore((state) => state.createBot);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  if (!open) return null;
  const submit = (e: FormEvent): void => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) return;
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) { alert('Username must be 3-32 characters, alphanumeric and underscores only'); return; }
    try { const botId = createBot(name, username, description); setName(''); setUsername(''); setDescription(''); onClose(); onCreated?.(botId); } catch (error) { console.error('Failed to create bot:', error); }
  };
  return (
    <Dialog open={open} title="New Bot" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input label="Bot Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={64} placeholder="My Assistant Bot" autoFocus />
        <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={32} placeholder="my_bot" prefix="@" />
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gotoap-ink-muted">Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={256} rows={2} placeholder="What does this bot do?" className="w-full rounded-xl border border-gotoap-hover bg-gotoap-panel px-3 py-2 text-sm text-gotoap-ink placeholder:text-gotoap-ink-faint focus:border-gotoap-accent focus:outline-none focus:ring-2 focus:ring-gotoap-accent/30" />
        </label>
        <p className="text-xs text-gotoap-ink-faint">Bots can respond to commands and integrate with AI.</p>
        <Button type="submit" className="w-full" disabled={!name.trim() || !username.trim()}>Create Bot</Button>
      </form>
    </Dialog>
  );
}
