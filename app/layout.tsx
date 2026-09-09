import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Готоап — децентралізований P2P-месенджер',
  description:
    'Повністю децентралізований P2P-месенджер із вбудованим ШІ: WebRTC, WebTorrent, DID та локальний ШІ у браузері.',
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
    <html lang="uk" className="dark">
      <body>{children}</body>
    </html>
  );
}
