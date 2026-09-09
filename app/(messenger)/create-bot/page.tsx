'use client';
import { useRouter } from 'next/navigation';
import { CreateBotDialog } from '@/components/bots/CreateBotDialog';
import { useState } from 'react';
export default function CreateBotPage(): React.JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-gotoap-bg p-4">
      <CreateBotDialog open={open} onClose={() => { setOpen(false); router.push('/'); }} onCreated={(id) => router.push('/chat/' + encodeURIComponent(id))} />
    </div>
  );
}
