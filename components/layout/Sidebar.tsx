'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/profile/Avatar';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';

import { ChatList } from '@/components/chats/ChatList';
import { ProfileDialog } from '@/components/profile/ProfileDialog';
import { ArchiveList } from '@/components/archive/ArchiveList';
import { ContactsList } from '@/components/contacts/ContactsList';
import { ArchiveIcon, BotIcon, CallsIcon, ChatsIcon, ContactsIcon, GroupIcon, LogoIcon, MenuIcon, SearchIcon, SettingsIcon, UserIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';
import { Menu } from '@/components/ui/Menu';

export function Sidebar(): React.JSX.Element {
  const router = useRouter();
  const profile = useVortexStore((state) => state.profile);
  const did = useVortexStore((state) => state.currentDid?.did ?? '');
  const [query, setQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (searchOpen) return <GlobalSearch onClose={() => setSearchOpen(false)} />;
  if (settingsOpen) return <ProfileSettings onBack={() => setSettingsOpen(false)} />;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b border-gotoap-line px-3 py-2.5">
        <button type="button" onClick={() => setProfileOpen(true)} aria-label="Open my profile" title="My profile" className="rounded-full transition hover:opacity-85">
          <Avatar seed={did} name={profile.displayName} colorId={profile.avatarColor} size={38} online />
        </button>
        <div className="relative flex-1">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gotoap-ink-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setSearchOpen(true)} placeholder="Search" aria-label="Search chats" className="h-9 w-full rounded-full bg-gotoap-hover pl-9 pr-3 text-sm text-gotoap-ink placeholder:text-gotoap-ink-muted focus:bg-gotoap-bg focus:outline-none focus:ring-1 focus:ring-gotoap-accent/50" />
        </div>
        <div className="relative">
          <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink">
            <MenuIcon size={18} />
          </button>
          <Menu open={menuOpen} align="right" onClose={() => setMenuOpen(false)} items={[
            { label: 'New Group', icon: <GroupIcon size={16} />, onSelect: () => { setMenuOpen(false); setComposeOpen(true); } },
            { label: 'New Bot', icon: <BotIcon size={16} />, onSelect: () => { setMenuOpen(false); router.push('/create-bot'); } },
            { label: 'Contacts', icon: <ContactsIcon size={16} />, onSelect: () => { setMenuOpen(false); setShowContacts(true); } },
            { label: 'Archived', icon: <ArchiveIcon size={16} />, onSelect: () => { setMenuOpen(false); setShowArchive(true); } },
            { label: 'Settings', icon: <SettingsIcon size={16} />, onSelect: () => { setMenuOpen(false); setSettingsOpen(true); } },
          ]} />
        </div>
      </header>
      {showArchive ? (
        <>
          <button type="button" onClick={() => setShowArchive(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gotoap-ink-muted hover:text-gotoap-ink">← Back to chats</button>
          <ArchiveList />
        </>
      ) : showContacts ? (
        <>
          <button type="button" onClick={() => setShowContacts(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gotoap-ink-muted hover:text-gotoap-ink">← Back to chats</button>
          <ContactsList />
        </>
      ) : (
        <>
          <nav aria-label="Folders" className="flex items-center gap-1 border-b border-gotoap-line px-2 pb-1.5">
            <button type="button" onClick={() => setShowContacts(false)} className="flex items-center gap-1.5 rounded-lg bg-gotoap-hover px-2.5 py-1.5 text-xs font-medium text-gotoap-ink"><ChatsIcon size={14} /> All</button>
            <button type="button" onClick={() => setShowContacts(true)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink"><ContactsIcon size={14} /> Contacts</button>
            <button type="button" onClick={() => router.push('/calls')} className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink sm:flex"><CallsIcon size={14} /> Calls</button>
          </nav>
          <ChatList query={query} />
        </>
      )}
      <footer className="flex items-center gap-2 border-t border-gotoap-line px-2 py-1.5">
        <Link href="/settings" className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">
          <SettingsIcon size={18} />
          <span>Settings</span>
        </Link>
        <span className="inline-flex items-center gap-1.5 text-[11px] text-gotoap-ink-faint"><LogoIcon size={14} className="text-gotoap-accent" /> Gotoap</span>
      </footer>
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
      <CreateGroupDialog open={composeOpen} onClose={() => setComposeOpen(false)} onCreated={(id) => router.push('/chat/' + encodeURIComponent(id))} />
    </div>
  );
}
