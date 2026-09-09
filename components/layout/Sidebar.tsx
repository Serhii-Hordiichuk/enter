'use client';

/** Left sidebar: profile avatar, search, chat list, and settings entry. */
import { useState } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/profile/Avatar';
import { ProfileDialog } from '@/components/profile/ProfileDialog';
import { NewChatDialog } from '@/components/chats/NewChatDialog';
import { ChatList } from '@/components/chats/ChatList';
import { ComposeIcon, LogoIcon, SearchIcon, SettingsIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';

export function Sidebar(): React.JSX.Element {
  const profile = useVortexStore((state) => state.profile);
  const did = useVortexStore((state) => state.currentDid?.did ?? '');
  const [query, setQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 px-3 py-2.5">
        <button type="button" onClick={() => setProfileOpen(true)} aria-label="Open my profile" title="My profile" className="rounded-full transition hover:opacity-85">
          <Avatar seed={did} name={profile.displayName} colorId={profile.colorId} size={38} />
        </button>
        <div className="relative flex-1">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gotoap-ink-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search chats"
            className="h-9 w-full rounded-full bg-gotoap-hover pl-9 pr-3 text-sm text-gotoap-ink placeholder:text-gotoap-ink-muted focus:bg-gotoap-bg focus:outline-none focus:ring-1 focus:ring-gotoap-accent/50"
          />
        </div>
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          aria-label="New chat"
          title="New chat"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gotoap-accent text-white transition hover:bg-gotoap-accent-hover"
        >
          <ComposeIcon size={18} />
        </button>
      </header>
      <ChatList query={query} />
      <footer className="border-t border-gotoap-line px-2 py-1.5">
        <Link href="/settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink">
          <SettingsIcon size={18} />
          <span>Settings</span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-gotoap-ink-faint">
            <LogoIcon size={14} className="text-gotoap-accent" />
            Gotoap
          </span>
        </Link>
      </footer>
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
      <NewChatDialog open={composeOpen} onClose={() => setComposeOpen(false)} />
    </div>
  );
}
