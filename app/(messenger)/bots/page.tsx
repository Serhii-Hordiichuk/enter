'use client';

import { useRouter } from 'next/navigation';
import { BotsList } from '@/components/bots/BotsList';
import { CreateBotDialog } from '@/components/bots/CreateBotDialog';
import { useState } from 'react';

export default function BotsPage(): React.JSX.Element {
  const router = useRouter();
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col bg-gotoap-bg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gotoap-line bg-gotoap-panel px-4">
        <button type="button" onClick={() => router.push('/')} aria-label="Back to chats" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-base font-semibold text-gotoap-ink">Bots</h1>
      </header>
      <BotsList onNewBot={() => setComposeOpen(true)} />
      <CreateBotDialog open={composeOpen} onClose={() => setComposeOpen(false)} onCreated={(id) => { setComposeOpen(false); router.push('/chat/' + encodeURIComponent(id)); }} />
    </div>
  );
}