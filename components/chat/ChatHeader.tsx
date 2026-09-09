'use client';

/** Chat top bar: back, peer identity/status, in-chat search, AI, room menu, and profile panel. */
import { useState } from 'react';
import { Avatar } from '@/components/profile/Avatar';
import { Menu } from '@/components/ui/Menu';
import { RenameDialog } from '@/components/chats/RenameDialog';
import {
    ArchiveIcon, BackIcon, BellIcon, BellOffIcon, ImageIcon, MoreIcon, PencilIcon, PinIcon, SearchIcon, SparkIcon, TrashIcon,
} from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface ChatHeaderProps {
  roomId: string;
  peerCount: number;
  peerName: string;
  typingPeers: string[];
    aiBusy: boolean;
  aiPanelOpen: boolean;
  onToggleAiPanel: () => void;
  onOpenSharedMedia: () => void;
  onOpenSearch: () => void;
  onBack: () => void;
  onLeave: () => void;
  onOpenProfile: () => void;
}

export function ChatHeader(props: ChatHeaderProps): React.JSX.Element {
    const { roomId, peerCount, peerName, typingPeers, aiBusy, aiPanelOpen, onToggleAiPanel, onOpenSharedMedia, onOpenSearch, onBack, onLeave, onOpenProfile } = props;
  const room = useVortexStore((state) => state.activeRooms.find((item) => item.id === roomId) ?? null);
  const toggleRoomPinned = useVortexStore((state) => state.toggleRoomPinned);
  const toggleRoomMuted = useVortexStore((state) => state.toggleRoomMuted);
  const toggleRoomArchived = useVortexStore((state) => state.toggleRoomArchived);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = typingPeers.length > 0 ? 'typing...' : peerCount > 0 ? 'online' : 'waiting for a peer';
  const menuItems = [
    { label: room?.pinned ? 'Unpin chat' : 'Pin chat', icon: <PinIcon size={16} />, onSelect: () => toggleRoomPinned(roomId) },
    { label: room?.muted ? 'Unmute notifications' : 'Mute notifications', icon: room?.muted ? <BellIcon size={16} /> : <BellOffIcon size={16} />, onSelect: () => toggleRoomMuted(roomId) },
    { label: room?.archived ? 'Unarchive chat' : 'Archive chat', icon: <ArchiveIcon size={16} />, onSelect: () => toggleRoomArchived(roomId) },
    { label: 'Rename chat', icon: <PencilIcon size={16} />, onSelect: () => setRenameOpen(true) },
    { label: 'Delete chat', icon: <TrashIcon size={16} />, danger: true, onSelect: () => setConfirmDelete(true) },
  ];

  return (
    <header className="relative z-20 flex items-center gap-2 border-b border-gotoap-line bg-gotoap-panel px-2 py-2 sm:px-4">
      <button type="button" onClick={onBack} aria-label="Back to the chat list" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink lg:hidden">
        <BackIcon size={20} />
      </button>
      <button type="button" onClick={onOpenProfile} aria-label="Open the chat profile" className="flex min-w-0 items-center gap-3 text-left">
        <Avatar seed={room?.peerDid ?? roomId} name={peerName} size={40} online={peerCount > 0} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold text-gotoap-ink">{peerName}</h1>
          <p className={'truncate text-xs ' + (typingPeers.length > 0 ? 'text-gotoap-accent' : peerCount > 0 ? 'text-gotoap-accent-muted' : 'text-gotoap-ink-faint')}>{status}</p>
        </div>
      </button>
      <button type="button" onClick={onOpenSearch} aria-label="Search in this chat" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">
        <SearchIcon size={19} />
      </button>
      <button type="button" onClick={onOpenSharedMedia} aria-label="Shared media" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">
        <ImageIcon size={19} />
      </button>
      <button type="button" onClick={onToggleAiPanel} aria-label="Toggle the AI assistant" aria-pressed={aiPanelOpen} className={'inline-flex h-9 w-9 items-center justify-center rounded-full transition ' + (aiPanelOpen ? 'bg-gotoap-accent text-white hover:bg-gotoap-accent-hover' : 'text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink')}>
        {aiBusy ? <span className="inline-flex animate-pulse"><SparkIcon size={19} /></span> : <SparkIcon size={19} />}
      </button>
      <div className="relative">
        <button type="button" onClick={() => setMenuOpen((value) => !value)} aria-label="Chat menu" aria-expanded={menuOpen} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">
          <MoreIcon size={19} />
        </button>
        <Menu open={menuOpen} items={menuItems} onClose={() => setMenuOpen(false)} />
      </div>
      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Delete the chat">
          <button type="button" aria-label="Close" onClick={() => setConfirmDelete(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-sm rounded-2xl border border-gotoap-line bg-gotoap-panel p-5 shadow-2xl">
            <h2 className="text-base font-semibold text-gotoap-ink">Delete this chat?</h2>
            <p className="mt-1.5 text-sm text-gotoap-ink-muted">The history and the P2P connection for this room will be removed from this device.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-xl px-4 py-2 text-sm text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">Cancel</button>
              <button type="button" onClick={() => { setConfirmDelete(false); onLeave(); }} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      ) : null}
      <RenameDialog roomId={roomId} currentTitle={room?.title ?? ''} open={renameOpen} onClose={() => setRenameOpen(false)} />
    </header>
  );
}
