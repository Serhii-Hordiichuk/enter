'use client';

/** Dialog for starting a new chat by peer DID or a shared room name. */
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DidBadge } from '@/components/did/DidBadge';
import { Avatar } from '@/components/profile/Avatar';
import { useVortexStore } from '@/lib/store/useVortexStore';
import { parseChatTarget } from '@/lib/p2p/trysteroSetup';

interface NewChatDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewChatDialog({ open, onClose }: NewChatDialogProps): React.JSX.Element | null {
  const router = useRouter();
  const myDid = useVortexStore((state) => state.currentDid?.did ?? null);
  const profile = useVortexStore((state) => state.profile);
  const peerProfiles = useVortexStore((state) => state.peerProfiles);
  const startRoom = useVortexStore((state) => state.startRoom);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const q = value.trim().toLowerCase().replace(/^@/, '');
  const suggestions = q.length >= 2
    ? Object.values(peerProfiles)
        .filter((peer) => {
          if (peer.did === myDid) return false;
          const hay = ((peer.displayName ?? '') + ' ' + (peer.did ?? '')).toLowerCase();
          return q.split(/\s+/).every((word) => hay.includes(word));
        })
        .slice(0, 5)
    : [];

  const openRoom = (target: string, peerDid: string | null): void => {
    try {
      const roomId = startRoom(target, peerDid);
      setError(null);
      setValue('');
      onClose();
      router.push('/chat/' + encodeURIComponent(roomId));
    } catch (err) {
      console.error('Failed to create the chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to create the chat');
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const target = value.trim();
    if (!target) {
      setError('Введіть @нік, DID або спільну назву кімнати');
      return;
    }
    try {
      const parsed = parseChatTarget(target);
      openRoom(parsed.value, parsed.peerDid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create the chat');
    }
  };

  return (
    <Dialog open={open} title="Новий чат" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input
          label="@нік, DID або кімната"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="@nick, did:peer:z... або secret-room-42"
          error={error}
          autoFocus
        />
        {suggestions.length > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gotoap-ink-muted">Знайдені поруч</span>
            {suggestions.map((peer) => (
              <button key={peer.did} type="button" onClick={() => openRoom(peer.did, peer.did)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-gotoap-hover">
                <Avatar seed={peer.did} name={peer.displayName} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gotoap-ink">{peer.displayName || peer.did.slice(0, 18)}</span>
                  <span className="block truncate font-mono text-[11px] text-gotoap-ink-muted">{peer.did}</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="flex gap-2">
          {['@', 'did:peer:', 'room-'].map((prefix) => (
            <button key={prefix} type="button" onClick={() => setValue(prefix)} className="rounded-lg bg-gotoap-hover px-2 py-1 font-mono text-xs text-gotoap-ink-muted transition hover:text-gotoap-ink">
              {prefix}
            </button>
          ))}
          <span className="flex-1" />
        </div>
        <p className="text-xs text-gotoap-ink-muted">1 клік: встав @нік або DID — і чат готовий. Або домовтесь про однакову назву кімнати.</p>
        {myDid ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-gotoap-ink-muted">Мій нік: @{profile.username || 'без ніку'} — поділись ним</span>
            <DidBadge did={myDid} compact />
          </div>
        ) : null}
        <Button type="submit" className="mt-1 w-full">Почати чат</Button>
      </form>
    </Dialog>
  );
}
