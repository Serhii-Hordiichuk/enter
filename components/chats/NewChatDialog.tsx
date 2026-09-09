'use client';

/** Dialog for starting a new chat by peer DID or a shared room name. */
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DidBadge } from '@/components/did/DidBadge';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface NewChatDialogProps {
  open: boolean;
  onClose: () => void;
}

export function NewChatDialog({ open, onClose }: NewChatDialogProps): React.JSX.Element | null {
  const router = useRouter();
  const myDid = useVortexStore((state) => state.currentDid?.did ?? null);
  const startRoom = useVortexStore((state) => state.startRoom);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const target = value.trim();
    if (!target) {
      setError('Enter the peer DID or a shared room name');
      return;
    }
    try {
      const roomId = startRoom(target, target.startsWith('did:peer:') ? target : null);
      setError(null);
      setValue('');
      onClose();
      router.push('/chat/' + encodeURIComponent(roomId));
    } catch (err) {
      console.error('Failed to create the chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to create the chat');
    }
  };

  return (
    <Dialog open={open} title="New chat" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input
          label="Peer DID or room name"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="did:peer:z... or secret-room-42"
          error={error}
          autoFocus
        />
        <p className="text-xs text-gotoap-ink-muted">Both peers must enter the same room name to meet over the P2P network.</p>
        {myDid ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-gotoap-ink-muted">Your DID to share</span>
            <DidBadge did={myDid} compact />
          </div>
        ) : null}
        <Button type="submit" className="mt-1 w-full">Start chat</Button>
      </form>
    </Dialog>
  );
}
