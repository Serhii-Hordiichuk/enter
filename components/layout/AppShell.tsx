'use client';

/** Responsive messenger shell: sidebar + content pane + mobile bottom nav, Telegram-like. */
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { DidWalletCreator } from '@/components/did/DidWalletCreator';
import { LogoIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';
import { ChatsIcon, GroupIcon, BotIcon, ContactsIcon, CallsIcon, SettingsIcon } from '@/components/icons';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const currentDid = useVortexStore((state) => state.currentDid);
  const ensureDid = useVortexStore((state) => state.ensureDid);
  const [checked, setChecked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkDid = async () => {
      try {
        await ensureDid();
        if (isMounted) setChecked(true);
      } catch (error) {
        console.error('Failed to initialize DID:', error);
        // Even if DID initialization fails, we still want to render the UI
        // so the user can see any error messages or try again
        if (isMounted) setChecked(true);
      }
    };
    checkDid();
    return () => {
      isMounted = false;
    };
  }, [ensureDid]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!checked) {
    return (
      <div className="flex h-dvh items-center justify-center bg-gotoap-bg">
        <LogoIcon size={56} className="animate-pulse text-gotoap-accent" />
      </div>
    );
  }

  if (!currentDid) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-gotoap-bg px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gotoap-accent/15 text-gotoap-accent">
              <LogoIcon size={40} />
            </span>
            <h1 className="text-2xl font-bold text-gotoap-ink">Welcome to Gotoap</h1>
            <p className="text-sm text-gotoap-ink-muted">A decentralized P2P messenger. Create your identity to start chatting.</p>
          </div>
          <DidWalletCreator onCreated={() => { try { ensureDid(); } catch (error) { console.error('Failed to load the created DID:', error); } }} />
        </div>
      </main>
    );
  }

  // Mobile bottom nav tabs - all 6 sections
  const bottomTabs = [
    { id: 'chats', label: 'Chats', icon: <ChatsIcon size={20} />, href: '/' },
    { id: 'groups', label: 'Groups', icon: <GroupIcon size={20} />, href: '/groups' },
    { id: 'bots', label: 'Bots', icon: <BotIcon size={20} />, href: '/bots' },
    { id: 'contacts', label: 'Contacts', icon: <ContactsIcon size={20} />, href: '/contacts' },
    { id: 'calls', label: 'Calls', icon: <CallsIcon size={20} />, href: '/calls' },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} />, href: '/settings' },
  ] as const;

  const handleBottomTabClick = (href: string): void => {
    if (pathname === href) return;
    router.push(href);
  };

  // Determine if we should show the full-page mobile content (when not on home page)
  const isHomePage = pathname === '/';

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-gotoap-bg">
      {/* Desktop sidebar - shown on lg+ */}
      {!isMobile && (
        <aside className="hidden lg:flex lg:w-[380px] shrink-0 flex-col border-r border-gotoap-line bg-gotoap-panel">
          <Sidebar />
        </aside>
      )}

      {/* Mobile home content - sidebar only on home page */}
      {isMobile && isHomePage && (
        <aside className="lg:hidden w-full shrink-0 flex-col border-r border-gotoap-line bg-gotoap-panel">
          <Sidebar />
        </aside>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        {children}
      </main>

      {/* Mobile bottom navigation - shown on all mobile pages with proper padding */}
      {isMobile && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-gotoap-line bg-gotoap-panel px-2 safe-area-inset-bottom"
          aria-label="Main navigation"
          role="tablist"
        >
          {bottomTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={pathname === tab.href}
              onClick={() => handleBottomTabClick(tab.href)}
              className={`
                flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors
                ${pathname === tab.href
                  ? 'text-gotoap-accent'
                  : 'text-gotoap-ink-muted'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

    </div>
  );
}
