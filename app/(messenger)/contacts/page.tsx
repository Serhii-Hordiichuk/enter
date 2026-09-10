'use client';

import { useRouter } from 'next/navigation';
import { ContactsList } from '@/components/contacts/ContactsList';
import { BackIcon } from '@/components/icons';

export default function ContactsPage(): React.JSX.Element {
  const router = useRouter();
  
  return (
    <div className="flex h-full min-h-0 flex-col bg-gotoap-bg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gotoap-line bg-gotoap-panel px-4">
        <button type="button" onClick={() => router.push('/')} aria-label="Back to chats" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink">
          <BackIcon size={20} />
        </button>
        <h1 className="text-base font-semibold text-gotoap-ink">Contacts</h1>
      </header>
      <ContactsList />
    </div>
  );
}