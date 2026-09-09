'use client';

/** Responsive messenger shell: sidebar + content pane, Telegram-like. */
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { DidWalletCreator } from '@/components/did/DidWalletCreator';
import { LogoIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps): React.JSX.Element {
  const pathname = usePathname();
  const currentDid = useVortexStore((state) => state.currentDid);
  const ensureDid = useVortexStore((state) => state.ensureDid);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try { ensureDid(); } catch { /* No DID yet: the onboarding screen will be shown. */ }
    setChecked(true);
  }, [ensureDid]);

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

  const isDetail = pathname.startsWith('/chat/') || pathname === '/settings';

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-gotoap-bg">
      <aside className={(isDetail ? 'hidden' : 'flex') + ' w-full shrink-0 flex-col border-r border-gotoap-line bg-gotoap-panel lg:flex lg:w-[380px]'}>
        <Sidebar />
      </aside>
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
