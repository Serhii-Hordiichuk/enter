'use client';

/** Contacts list: peers the user has interacted with, with online status. */
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/profile/Avatar';
import { ChevronRightIcon, ContactsIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface ContactEntry {
  did: string;
  displayName?: string;
  bio?: string;
  lastMessageAt: number;
  online: boolean;
}

function formatLastSeen(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ContactsList(): React.JSX.Element {
  const router = useRouter();
  const peerProfiles = useVortexStore((state) => state.peerProfiles);
  const activeRooms = useVortexStore((state) => state.activeRooms);
  const startRoom = useVortexStore((state) => state.startRoom);
  const peers = useVortexStore((state) => state.peers);

  const contacts = useMemo((): ContactEntry[] => {
    const map = new Map<string, ContactEntry>();
    for (const room of activeRooms) {
      if (!room.peerDid) continue;
      const profile = peerProfiles[room.peerDid];
      const roomPeers = peers[room.id] ?? [];
      const entry = map.get(room.peerDid) ?? {
        did: room.peerDid,
        displayName: profile?.displayName,
        bio: profile?.bio,
        lastMessageAt: room.lastMessageAt,
        online: false,
      };
      entry.online = entry.online || roomPeers.some((p) => p.peerId === room.peerDid);
      entry.lastMessageAt = Math.max(entry.lastMessageAt, room.lastMessageAt);
      if (profile?.displayName) entry.displayName = profile.displayName;
      if (profile?.bio) entry.bio = profile.bio;
      map.set(room.peerDid, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.lastMessageAt - a.lastMessageAt);
  }, [peerProfiles, activeRooms, peers]);

  const handleContactClick = (did: string): void => {
    try {
      const roomId = startRoom(did, did);
      router.push('/chat/' + encodeURIComponent(roomId));
    } catch (error) {
      console.error('Failed to open contact chat:', error);
    }
  };

  if (contacts.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gotoap-hover text-gotoap-ink-muted">
          <ContactsIcon size={32} />
        </span>
        <p className="text-sm font-medium text-gotoap-ink">No contacts yet</p>
        <p className="max-w-xs text-xs text-gotoap-ink-muted">Contacts appear here after you chat with peers in P2P rooms.</p>
      </div>
    );
  }

  return (
    <nav className="gotoap-scroll flex-1 overflow-y-auto px-2 pb-3" aria-label="Contacts">
      <div className="flex flex-col gap-0.5">
        {contacts.map((contact) => (
          <button key={contact.did} type="button" onClick={() => handleContactClick(contact.did)} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-gotoap-hover">
            <Avatar seed={contact.did} name={contact.displayName} size={48} online={contact.online} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-gotoap-ink">{contact.displayName || contact.did.slice(0, 18) + '...'}</p>
              <p className="truncate text-xs text-gotoap-ink-muted">{contact.online ? 'online' : contact.bio || 'last seen ' + formatLastSeen(contact.lastMessageAt)}</p>
            </div>
            <ChevronRightIcon size={16} className="shrink-0 text-gotoap-ink-faint" />
          </button>
        ))}
      </div>
    </nav>
  );
}
