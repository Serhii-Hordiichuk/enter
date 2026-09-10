'use client';

import { useState } from 'react';
import { WelcomePane } from '@/components/layout/WelcomePane';
import { NewChatDialog } from '@/components/chats/NewChatDialog';
import { InviteCard } from '@/components/did/InviteCard';

/** Home route: welcome pane on the right, chat list in the sidebar. */
export default function HomePage(): React.JSX.Element {
  const [composeOpen, setComposeOpen] = useState(false);
  return (
    <div className="gotoap-chat-bg flex h-full w-full items-start justify-center overflow-y-auto p-6">
      <div className="flex w-full max-w-md flex-col gap-4">
        <WelcomePane onStartChat={() => setComposeOpen(true)} />
        <InviteCard />
      </div>
      <NewChatDialog open={composeOpen} onClose={() => setComposeOpen(false)} />
    </div>
  );
}
