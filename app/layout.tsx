'use client';

import { useEffect } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistrar } from '@/components/layout/ServiceWorkerRegistrar';
import { useVortexStore } from '@/lib/store/useVortexStore';
import { detectLocale } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Gotoap - Decentralized P2P Messenger',
  description: 'A fully decentralized P2P messenger with built-in AI: WebRTC, WebTorrent, DIDs, and in-browser local AI.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  applicationName: 'Gotoap',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Gotoap' },
};

export const viewport: Viewport = {
  themeColor: '#0e1621',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Resolve the effective theme: 'system' follows prefers-color-scheme.
 * Returns 'light' | 'dark' for the data-theme attribute.
 */
function resolveEffectiveTheme(theme: string): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }
  return theme as 'light' | 'dark';
}

function ThemeLangSync(): null {
  const theme = useVortexStore((state) => state.theme);
  const appName = useVortexStore((state) => state.profile.appName);

  useEffect(() => {
    const effective = resolveEffectiveTheme(theme);
    const root = document.documentElement;
    root.setAttribute('data-theme', effective);
    root.lang = detectLocale();
    // Sync theme-color meta for browser chrome.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', effective === 'light' ? '#f0f2f5' : '#0e1621');
  }, [theme]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = appName ? appName : 'Gotoap Messenger';
    }
  }, [appName]);

  return null;
}

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  const theme = useVortexStore((state) => state.theme);
  const effective = resolveEffectiveTheme(theme);

  return (
    <html lang={detectLocale()} data-theme={effective} className={effective === 'dark' ? 'dark' : ''}>
      <body>
        {children}
        <ServiceWorkerRegistrar />
        <ThemeLangSync />
      </body>
    </html>
  );
}
