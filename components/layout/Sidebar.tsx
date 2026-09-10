'use client';

import { useState, useEffect } from 'react';
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
import { ArchiveIcon, BotIcon, CallsIcon, ChatsIcon, ContactsIcon, GroupIcon, MenuIcon, SavedIcon, SearchIcon, SettingsIcon, ComposeIcon } from '@/components/icons';
import { CallHistoryInline } from '@/components/calls/CallHistoryInline';
import { useVortexStore } from '@/lib/store/useVortexStore';
import { Menu } from '@/components/ui/Menu';
import { SAVED_MESSAGES_ROOM } from '@/lib/p2p/trysteroSetup';

type Tab = 'chats' | 'groups' | 'bots' | 'contacts' | 'calls' | 'archive';

type MobileTab = 'chats' | 'contacts' | 'calls' | 'settings';

interface SidebarProps {
  onOpenSharedMedia: (roomId: string) => void;
}

export function Sidebar({ onOpenSharedMedia }: SidebarProps): React.JSX.Element {
  const router = useRouter();
  const profile = useVortexStore((state) => state.profile);
  const startRoom = useVortexStore((state) => state.startRoom);
  const groupCount = useVortexStore((state) => state.groups.length);
  const botCount = useVortexStore((state) => state.bots.length);
  const unreadCalls = useVortexStore((state) => state.callHistory.filter(c => c.type === 'missed').length);
  
  const [query, setQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('chats');
  const [mobileTab, setMobileTab] = useState<MobileTab>('chats');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (searchOpen) return <GlobalSearch onClose={() => setSearchOpen(false)} />;
  if (settingsOpen) return <ProfileSettings onBack={() => setSettingsOpen(false)} />;

  const openSaved = (): void => {
    try { startRoom(SAVED_MESSAGES_ROOM); router.push('/chat/' + encodeURIComponent(SAVED_MESSAGES_ROOM)); } catch (error) { console.error('Failed to open Saved Messages:', error); }
  };

  // Desktop folders (horizontal tabs under search)
  const desktopTabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number; shortLabel: string }[] = [
    { id: 'chats', label: 'All Chats', shortLabel: 'Chats', icon: <ChatsIcon size={16} /> },
    { id: 'groups', label: 'Groups', shortLabel: 'Groups', icon: <GroupIcon size={16} />, badge: groupCount },
    { id: 'bots', label: 'Bots', shortLabel: 'Bots', icon: <BotIcon size={16} />, badge: botCount },
    { id: 'contacts', label: 'Contacts', shortLabel: 'Contacts', icon: <ContactsIcon size={16} /> },
    { id: 'calls', label: 'Calls', shortLabel: 'Calls', icon: <CallsIcon size={16} />, badge: unreadCalls },
    { id: 'archive', label: 'Archive', shortLabel: 'Archive', icon: <ArchiveIcon size={16} /> },
  ];

  // Mobile bottom tabs
  const mobileTabs: { id: MobileTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'chats', label: 'Chats', icon: <ChatsIcon size={20} /> },
    { id: 'contacts', label: 'Contacts', icon: <ContactsIcon size={20} /> },
    { id: 'calls', label: 'Calls', icon: <CallsIcon size={20} />, badge: unreadCalls },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
  ];

  // Drawer menu items (hamburger menu)
  const drawerItems = [
    { label: 'Saved Messages', icon: <SavedIcon size={20} />, onSelect: () => { setDrawerOpen(false); openSaved(); } },
    { label: 'New Group', icon: <GroupIcon size={20} />, onSelect: () => { setDrawerOpen(false); setComposeOpen(true); } },
    { label: 'New Bot', icon: <BotIcon size={20} />, onSelect: () => { setDrawerOpen(false); router.push('/create-bot'); } },
    { label: 'Settings', icon: <SettingsIcon size={20} />, onSelect: () => { setDrawerOpen(false); setSettingsOpen(true); } },
  ];

  // Current active section content
  const renderContent = () => {
    if (isMobile) {
      switch (mobileTab) {
        case 'chats': return <ChatList query={query} onOpenSharedMedia={onOpenSharedMedia} />;
        case 'contacts': return <ContactsList />;
        case 'calls': return <CallHistoryInline />;
        case 'settings': return <ProfileSettings onBack={() => setMobileTab('chats')} />;
      }
    } else {
      switch (tab) {
        case 'chats': return <ChatList query={query} onOpenSharedMedia={onOpenSharedMedia} />;
        case 'groups': return <GroupsList onNewGroup={() => setComposeOpen(true)} />;
        case 'bots': return <BotsList onNewBot={() => router.push('/create-bot')} />;
        case 'contacts': return <ContactsList />;
        case 'calls': return <CallHistoryInline />;
        case 'archive': return <ArchiveList />;
      }
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-gotoap-panel">
      {/* Desktop header */}
      {!isMobile && (
        <header className="flex items-center gap-2 border-b border-gotoap-line px-3 py-2.5 shrink-0">
          {/* Hamburger menu */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink transition-colors"
          >
            <MenuIcon size={22} />
          </button>

          {/* Search bar */}
          <div className="relative flex-1 min-w-0">
            <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gotoap-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search messages, users, groups..."
              aria-label="Search"
              className="h-9 w-full rounded-full bg-gotoap-hover pl-9 pr-10 text-sm text-gotoap-ink placeholder:text-gotoap-ink-muted focus:bg-gotoap-bg focus:outline-none focus:ring-1 focus:ring-gotoap-accent/50"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gotoap-ink-muted hover:text-gotoap-ink"
              >
                <SearchIcon size={16} className="rotate-45" />
              </button>
            )}
          </div>

          {/* Compose button */}
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            aria-label="New message"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink transition-colors"
          >
            <ComposeIcon size={20} />
          </button>
        </header>
      )}

      {/* Mobile header */}
      {isMobile && (
        <header className="flex items-center gap-2 border-b border-gotoap-line px-3 py-2.5 shrink-0">
          {/* Hamburger menu */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink transition-colors"
          >
            <MenuIcon size={22} />
          </button>

          {/* Search bar */}
          <div className="relative flex-1 min-w-0">
            <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gotoap-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search..."
              aria-label="Search"
              className="h-9 w-full rounded-full bg-gotoap-hover pl-9 pr-3 text-sm text-gotoap-ink placeholder:text-gotoap-ink-muted focus:bg-gotoap-bg focus:outline-none focus:ring-1 focus:ring-gotoap-accent/50"
            />
          </div>

          {/* Compose button */}
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            aria-label="New message"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink transition-colors"
          >
            <ComposeIcon size={20} />
          </button>
        </header>
      )}

      {/* Desktop: Folder tabs under search */}
      {!isMobile && (
        <nav aria-label="Folders" className="flex gap-0.5 overflow-x-auto border-b border-gotoap-line px-2 py-1.5 shrink-0" role="tablist">
          {desktopTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={
                'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ' +
                (tab === item.id
                  ? 'bg-gotoap-accent/20 text-gotoap-accent'
                  : 'text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink')
              }
            >
              {item.icon}
              <span className="hidden sm:inline">{item.shortLabel}</span>
              {item.badge && item.badge > 0 && (
                <span className="rounded-full bg-gotoap-accent/30 px-1.5 text-[10px] font-bold text-gotoap-accent">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      )}

      {/* Mobile: Menu below search */}
      {isMobile && (
        <div className="border-b border-gotoap-line px-2 py-2 shrink-0">
          <div className="flex gap-1 overflow-x-auto" role="tablist">
            {mobileTabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={mobileTab === item.id}
                onClick={() => setMobileTab(item.id)}
                className={
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ' +
                  (mobileTab === item.id
                    ? 'bg-gotoap-accent/20 text-gotoap-accent'
                    : 'text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink')
                }
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="rounded-full bg-gotoap-accent/30 px-1.5 text-[10px] font-bold text-gotoap-accent">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="gotoap-scroll flex-1 overflow-y-auto min-h-0">
        {renderContent()}
      </div>

      {/* Desktop footer */}
      {!isMobile && (
        <footer className="flex items-center gap-2 border-t border-gotoap-line px-2 py-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink"
          >
            <Avatar seed={profile.displayName} name={profile.displayName} colorId={profile.avatarColor} size={28} online />
            <span className="truncate">{profile.displayName || 'My Profile'}</span>
          </button>
        </footer>
      )}

      {/* Drawer (hamburger menu) */}
      <Menu
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        align="left"
        items={drawerItems}
      />

      {/* Dialogs */}
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
      <CreateGroupDialog open={composeOpen} onClose={() => setComposeOpen(false)} onCreated={(id) => router.push('/chat/' + encodeURIComponent(id))} />
    </div>
  );
}
