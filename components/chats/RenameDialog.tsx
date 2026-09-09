'use client';

/** Dialog for renaming a chat room locally. */
import { useState, type FormEvent } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface RenameDialogProps {
  roomId: string;
  currentTitle: string;
  open: boolean;
  onClose: () => void;
}

export function RenameDialog({ roomId, currentTitle, open, onClose }: RenameDialogProps): React.JSX.Element | null {
  const renameRoom = useVortexStore((state) => state.renameRoom);
  const [title, setTitle] = useState(currentTitle);
  if (!open) return null;

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    renameRoom(roomId, title);
    onClose();
  };

  return (
    <Dialog open={open} title="Rename chat" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input label="Chat name" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={64} autoFocus />
        <Button type="submit" className="w-full">Save name</Button>
      </form>
    </Dialog>
  );
}
