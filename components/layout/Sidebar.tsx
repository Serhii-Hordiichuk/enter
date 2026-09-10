'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { NewChatDialog } from '@/components/chats/NewChatDialog';
import { ChatList } from '@/components/chats/ChatList';
import { ProfileDialog } from '@/components/profile/ProfileDialog';
import { ArchiveIcon, BotIcon, CallsIcon, ChatsIcon, ContactsIcon, GroupIcon, MenuIcon, SavedIcon, SearchIcon, SettingsIcon, UserIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';
import { SAVED_MESSAGES_ROOM } from '@/lib/p2p/trysteroSetup';

type FolderId = 'all' | 'personal' | 'groups' | 'bots' | 'unread';

const FOLDERS: { id: FolderId; label: string }[] = [
  { id: 'all', label: 'Всі' },
  { id: 'personal', label: 'Особисті' },
  { id: 'groups', label: 'Групи' },
  { id: 'bots', label: 'Боти' },
  { id: 'unread', label: 'Непрочитані' },
];

export function Sidebar(): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const profile = useVortexStore((state) => state.profile);
  const startRoom = useVortexStore((state) => state.startRoom);
  const rooms = useVortexStore((state) => state.activeRooms);
  const unreadMap = useVortexStore((state) => state.unread);

  const [query, setQuery] = useState('');
  const [folder, setFolder] = useState<FolderId>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const folderUnread = (id: FolderId): number => {
    if (id === 'unread') return 0;
    return rooms
      .filter((room) => {
        if (room.archived) return false;
        if (id === 'personal') return !room.isGroup && !room.isBot;
        if (id === 'groups') return room.isGroup;
        if (id === 'bots') return room.isBot;
        return true;
      })
      .reduce((sum, room) => sum + (unreadMap[room.id] ?? 0), 0);
  };

  useEffect(() => {
    if (!drawerOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) setDrawerOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [drawerOpen]);

  const openSaved = (): void => {
    try { startRoom(SAVED_MESSAGES_ROOM); router.push('/chat/' + encodeURIComponent(SAVED_MESSAGES_ROOM)); } catch (error) { console.error('Failed to open Saved Messages:', error); }
  };

  const go = (href: string): void => {
    setDrawerOpen(false);
    if (pathname !== href) router.push(href);
  };

  const handleFolderSelect = (id: FolderId): void => {
    setFolder(id);
    if (pathname !== '/') router.push('/');
  };

  if (searchOpen) return <GlobalSearch onClose={() => setSearchOpen(false)} />;
  if (settingsOpen) return <ProfileSettings onBack={() => setSettingsOpen(false)} />;

  return (
    <div ref={sidebarRef} className="relative flex h-full min-h-0 bg-gotoap-panel">
      {/* Вузька іконкова колонка як у Telegram Desktop: гамбургер + папки */}
      <div className="hidden w-[72px] shrink-0 flex-col items-center gap-1 border-r border-gotoap-line py-2 md:flex">
        <button type="button" onClick={() => setDrawerOpen((open) => !open)} aria-label="Меню" aria-expanded={drawerOpen} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">
          <MenuIcon size={20} />
        </button>
        <div className="my-1 h-px w-10 bg-gotoap-line" />
        <nav aria-label="Папки чатів" className="flex w-full flex-col items-stretch gap-0.5 overflow-y-auto px-1.5">
          {FOLDERS.map((item) => {
            const active = folder === item.id;
            const count = folderUnread(item.id);
            return (
              <button key={item.id} type="button" aria-pressed={active} title={item.label} onClick={() => handleFolderSelect(item.id)} className={'relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium leading-tight transition ' + (active ? 'bg-gotoap-accent/15 text-gotoap-accent' : 'text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink')}>
                {item.id === 'all' ? <ChatsIcon size={20} /> : null}
                {item.id === 'personal' ? <UserIcon size={20} /> : null}
                {item.id === 'groups' ? <GroupIcon size={20} /> : null}
                {item.id === 'bots' ? <BotIcon size={20} /> : null}
                {item.id === 'unread' ? <ArchiveIcon size={20} /> : null}
                <span className="max-w-full truncate">{item.label}</span>
                {count > 0 ? (
                  <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-gotoap-accent px-1 py-px text-center text-[10px] font-bold leading-4 text-white">{count > 99 ? '99+' : count}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Колонка чатів: пошук + список */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-2 px-3 pb-2 pt-3">
          <button type="button" onClick={() => setDrawerOpen((open) => !open)} aria-label="Меню" aria-expanded={drawerOpen} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink md:hidden">
            <MenuIcon size={20} />
          </button>
          <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg bg-gotoap-hover px-3 text-sm">
            <SearchIcon size={16} className="shrink-0 text-gotoap-ink-muted" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setSearchOpen(true)} placeholder="Пошук" aria-label="Пошук" className="min-w-0 flex-1 bg-transparent text-gotoap-ink placeholder:text-gotoap-ink-muted focus:outline-none" />
          </div>
        </header>
        <div className="flex shrink-0 gap-1 overflow-x-auto px-3 pb-2 md:hidden" role="tablist" aria-label="Папки чатів">
          {FOLDERS.map((item) => {
            const active = folder === item.id;
            return (
              <button key={item.id} type="button" role="tab" aria-selected={active} onClick={() => handleFolderSelect(item.id)} className={'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ' + (active ? 'bg-gotoap-accent/15 text-gotoap-accent' : 'text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink')}>
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatList query={query} folder={folder} />
        </div>
      </div>

      {/* Гамбургер-шторка як у Telegram: профіль + пункти, без дубля-футера */}
      {drawerOpen ? (
        <>
          <button type="button" aria-label="Закрити меню" onClick={() => setDrawerOpen(false)} className="absolute inset-0 z-30 bg-black/50" />
          <div role="dialog" aria-label="Меню" className="absolute inset-y-0 left-0 z-40 flex w-[300px] max-w-[85%] flex-col bg-gotoap-panel shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                setProfileOpen(true);
              }}
              className="flex shrink-0 items-center gap-3 bg-gotoap-accent/10 px-4 pb-4 pt-5 text-left transition hover:bg-gotoap-accent/15"
            >
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gotoap-accent text-lg font-bold text-white">
                {(profile.displayName || 'G').slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-gotoap-ink">{profile.displayName || 'Мій профіль'}</span>
                <span className="block truncate text-xs text-gotoap-ink-muted">{profile.username ? '@' + profile.username : 'Переглянути профіль'}</span>
              </span>
            </button>
            <nav className="gotoap-scroll flex-1 overflow-y-auto px-2 py-2" aria-label="Розділи">
              <DrawerItem icon={<GroupIcon size={19} />} label="Нова група" onClick={() => { setDrawerOpen(false); setGroupDialogOpen(true); }} />
              <DrawerItem icon={<ChatsIcon size={19} />} label="Новий чат" onClick={() => { setDrawerOpen(false); setNewChatOpen(true); }} />
              <DrawerItem icon={<BotIcon size={19} />} label="Новий бот" onClick={() => go('/create-bot')} />
              <DrawerItem icon={<SavedIcon size={19} />} label="Збережені" onClick={() => { setDrawerOpen(false); openSaved(); }} />
              <div className="mx-3 my-2 h-px bg-gotoap-line" />
              <DrawerItem icon={<ContactsIcon size={19} />} label="Контакти" onClick={() => go('/contacts')} />
              <DrawerItem icon={<CallsIcon size={19} />} label="Дзвінки" onClick={() => go('/calls')} />
              <DrawerItem icon={<ArchiveIcon size={19} />} label="Архів" onClick={() => go('/archive')} />
              <DrawerItem icon={<SettingsIcon size={19} />} label="Налаштування" onClick={() => { setDrawerOpen(false); setSettingsOpen(true); }} />
            </nav>
          </div>
        </>
      ) : null}

      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
      <CreateGroupDialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} onCreated={(id) => router.push('/chat/' + encodeURIComponent(id))} />
      <NewChatDialog open={newChatOpen} onClose={() => setNewChatOpen(false)} />
    </div>
  );
}

function DrawerItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }): React.JSX.Element {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-4 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium text-gotoap-ink transition hover:bg-gotoap-hover">
      <span className="shrink-0 text-gotoap-ink-muted">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}
