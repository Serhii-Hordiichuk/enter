import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gotoap - Decentralized P2P Messenger',
  description: 'A fully decentralized P2P messenger with built-in AI: WebRTC, WebTorrent, DIDs, and in-browser local AI.',
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.JSX.Element {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
