import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistrar } from '@/components/layout/ServiceWorkerRegistrar';

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

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
