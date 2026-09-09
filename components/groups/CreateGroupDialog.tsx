'use client';
import { useState, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { useVortexStore } from '@/lib/store/useVortexStore';

export function CreateGroupDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (groupId: string) => void }): React.JSX.Element | null {
  const createGroup = useVortexStore((state) => state.createGroup);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  if (!open) return null;
  const submit = (e: FormEvent): void => {
    e.preventDefault();
    if (!title.trim()) return;
    try { const groupId = createGroup(title, description, isPublic); setTitle(''); setDescription(''); onClose(); onCreated?.(groupId); } catch (error) { console.error('Failed to create group:', error); }
  };
  return (
    <Dialog open={open} title="New Group" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input label="Group Name" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={64} placeholder="My Group" autoFocus />
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-gotoap-ink-muted">Description (optional)</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={256} rows={2} placeholder="What is this group about?" className="w-full rounded-xl border border-gotoap-hover bg-gotoap-panel px-3 py-2 text-sm text-gotoap-ink placeholder:text-gotoap-ink-faint focus:border-gotoap-accent focus:outline-none focus:ring-2 focus:ring-gotoap-accent/30" />
        </label>
        <Switch checked={isPublic} label="Public Group" description="Anyone can find this group via search" onChange={setIsPublic} />
        <Button type="submit" className="w-full" disabled={!title.trim()}>Create Group</Button>
      </form>
    </Dialog>
  );
}
