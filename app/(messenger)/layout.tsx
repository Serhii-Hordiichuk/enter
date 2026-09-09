import { AppShell } from '@/components/layout/AppShell';

interface MessengerLayoutProps {
  children: React.ReactNode;
}

/** Shared messenger shell (sidebar + content) for all messenger routes. */
export default function MessengerLayout({ children }: MessengerLayoutProps): React.JSX.Element {
  return <AppShell>{children}</AppShell>;
}
