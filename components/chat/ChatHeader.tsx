'use client';

/** Chat top bar: back navigation, peer identity, AI panel toggle, and room menu. */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/profile/Avatar';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Menu } from '@/components/ui/Menu';
import { Input } from '@/components/ui/Input';
import { BackIcon, BellOffIcon, CopyIcon, KeyIcon, MoreIcon, PinIcon, SparkIcon, TrashIcon } from '@/components/icons';
import { useRoomPeers, useVortexStore } from '@/lib/store/useVortexStore';

interface ChatHeaderProps {
  roomId: string;
  onOpenAi: () => void;
}

export function ChatHeader({ roomId, onOpenAi }: ChatHeaderProps): React.JSX.Element {
  const router = useRouter();
  const room = useVortexStore((state) => state.activeRooms.find((item) => item.id === roomId));
  const peers = useRoomPeers(roomId);
  const toggleRoomPinned = useVortexStore((state) => state.toggleRoomPinned);
  const toggleRoomMuted = useVortexStore((state) => state.toggleRoomMuted);
  const renameRoom = useVortexStore((state) => state.renameRoom);
  const deleteRoom = useVortexStore((state) => state.deleteRoom);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [copied, setCopied] = useState(false);

  const title = room?.title || (room?.peerDid ? room.peerDid.slice(0, 20) + '...' : roomId.slice(0, 20) + '...');
  const online = peers.length > 0;
  const identity = room?.peerDid ?? roomId;

  const copyRoomId = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(identity);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy the room identifier:', error);
    }
  };

  const menuItems = [
    { label: room?.pinned ? 'Unpin chat' : 'Pin chat', icon: <PinIcon size={16} />, onSelect: () => toggleRoomPinned(roomId) },
    { label: room?.muted ? 'Unmute' : 'Mute', icon: <BellOffIcon size={16} />, onSelect: () => toggleRoomMuted(roomId) },
    { label: 'Rename', icon: <KeyIcon size={16} />, onSelect: () => { setDraftTitle(room?.title ?? ''); setRenameOpen(true); } },
    { label: copied ? 'Copied!' : 'Copy ' + (room?.peerDid ? 'peer DID' : 'room ID'), icon: <CopyIcon size={16} />, onSelect: () => void copyRoomId() },
    { label: 'Delete chat', icon: <TrashIcon size={16} />, danger: true, onSelect: () => setDeleteOpen(true) },
  ];

  return (
    <header className="relative z-30 flex items-center gap-2.5 border-b border-gotoap-line bg-gotoap-panel px-2 py-2 sm:px-3">
      <button
        type="button"
        onClick={() => router.push('/')}
        aria-label="Back to the chat list"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink lg:hidden"
      >
        <BackIcon size={20} />
      </button>
      <Avatar seed={identity} name={room?.title || undefined} size={40} online={online} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-gotoap-ink" title={room?.title || identity}>{title}</p>
        <p className={'text-xs ' + (online ? 'text-gotoap-accent-muted' : 'text-gotoap-ink-muted')}>
          {online ? 'online' : 'offline - waiting for a peer'}
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenAi}
        aria-label="Open the AI assistant"
        title="AI assistant"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-accent"
      >
        <SparkIcon size={19} />
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label="Chat menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink"
        >
          <MoreIcon size={19} />
        </button>
        <Menu open={menuOpen} items={menuItems} onClose={() => setMenuOpen(false)} />
      </div>
      <Dialog open={renameOpen} title="Rename chat" onClose={() => setRenameOpen(false)}>
        <form
          onSubmit={(event) => { event.preventDefault(); renameRoom(roomId, draftTitle); setRenameOpen(false); }}
          className="flex flex-col gap-3"
        >
          <Input label="Chat name" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} maxLength={64} placeholder={identity} autoFocus />
          <Button type="submit" className="w-full">Save name</Button>
        </form>
      </Dialog>
      <Dialog open={deleteOpen} title="Delete chat" onClose={() => setDeleteOpen(false)}>
        <p className="text-sm text-gotoap-ink-muted">This removes the chat and its local history from this browser. The peer keeps their own copy.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { deleteRoom(roomId); setDeleteOpen(false); router.push('/'); }}>Delete</Button>
        </div>
      </Dialog>
    </header>
  );
}
