'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/profile/Avatar';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { GroupsList } from '@/components/groups/GroupsList';
import { BotsList } from '@/components/bots/BotsList';

import { ChatList } from '@/components/chats/ChatList';
import { ProfileDialog } from '@/components/profile/ProfileDialog';
import { ArchiveList } from '@/components/archive/ArchiveList';
import { ContactsList } from '@/components/contacts/ContactsList';
import { ArchiveIcon, BotIcon, CallsIcon, ChatsIcon, ContactsIcon, GroupIcon, LogoIcon, MenuIcon, SavedIcon, SearchIcon, SettingsIcon } from '@/components/icons';
import { CallHistoryInline } from '@/components/calls/CallHistoryInline';
import { useVortexStore } from '@/lib/store/useVortexStore';
import { Menu } from '@/components/ui/Menu';
import { SAVED_MESSAGES_ROOM } from '@/lib/p2p/trysteroSetup';

type Tab = 'chats' | 'groups' | 'bots' | 'contacts' | 'calls' | 'archive';

interface SidebarProps {
  onOpenSharedMedia: (roomId: string) => void;
}

export function Sidebar({ onOpenSharedMedia }: SidebarProps): React.JSX.Element {
  const router = useRouter();
  const profile = useVortexStore((state) => state.profile);
  const did = useVortexStore((state) => state.currentDid?.did ?? '');
  const startRoom = useVortexStore((state) => state.startRoom);
  const groupCount = useVortexStore((state) => state.groups.length);
  const botCount = useVortexStore((state) => state.bots.length);
  const [query, setQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('chats');
  const [menuOpen, setMenuOpen] = useState(false);

  if (searchOpen) return <GlobalSearch onClose={() => setSearchOpen(false)} />;
  if (settingsOpen) return <ProfileSettings onBack={() => setSettingsOpen(false)} />;

  const openSaved = (): void => {
    try { startRoom(SAVED_MESSAGES_ROOM); router.push('/chat/' + encodeURIComponent(SAVED_MESSAGES_ROOM)); } catch (error) { console.error('Failed to open Saved Messages:', error); }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'chats', label: 'All Chats', icon: <ChatsIcon size={14} /> },
    { id: 'groups', label: 'Groups', icon: <GroupIcon size={14} />, badge: groupCount },
    { id: 'bots', label: 'Bots', icon: <BotIcon size={14} />, badge: botCount },
    { id: 'contacts', label: 'Contacts', icon: <ContactsIcon size={14} /> },
    { id: 'calls', label: 'Calls', icon: <CallsIcon size={14} /> },
    { id: 'archive', label: 'Archive', icon: <ArchiveIcon size={14} /> },
  ];

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
            { label: 'Saved Messages', icon: <SavedIcon size={16} />, onSelect: () => { setMenuOpen(false); openSaved(); } },
            { label: 'New Group', icon: <GroupIcon size={16} />, onSelect: () => { setMenuOpen(false); setComposeOpen(true); } },
            { label: 'New Bot', icon: <BotIcon size={16} />, onSelect: () => { setMenuOpen(false); router.push('/create-bot'); } },
            { label: 'Settings', icon: <SettingsIcon size={16} />, onSelect: () => { setMenuOpen(false); setSettingsOpen(true); } },
          ]} />
        </div>
      </header>

      <nav aria-label="Folders" className="flex gap-1 overflow-x-auto border-b border-gotoap-line px-2 pb-1.5">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ' + (tab === item.id ? 'bg-gotoap-accent/20 text-gotoap-accent' : 'text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink')}
          >
            {item.icon}
            {item.label}
            {item.badge && item.badge > 0 ? <span className="rounded-full bg-gotoap-accent/30 px-1.5 text-[10px] font-bold text-gotoap-accent">{item.badge}</span> : null}
          </button>
        ))}
      </nav>

      {tab === 'chats' ? <ChatList query={query} onOpenSharedMedia={onOpenSharedMedia} /> : null}
      {tab === 'groups' ? <GroupsList onNewGroup={() => setComposeOpen(true)} /> : null}
      {tab === 'bots' ? <BotsList onNewBot={() => router.push('/create-bot')} /> : null}
      {tab === 'contacts' ? <ContactsList /> : null}
      {tab === 'calls' ? <CallHistoryInline /> : null}
      {tab === 'archive' ? <ArchiveList /> : null}

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
