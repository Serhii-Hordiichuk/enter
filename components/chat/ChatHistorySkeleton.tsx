'use client';

/** Simple skeleton placeholders shown while chat history loads. */
import { LogoIcon } from '@/components/icons';

export function ChatMessageSkeleton(): React.JSX.Element {
  return (
    <div className="mb-4 flex items-end gap-2.5">
      <span className="h-8 w-8 shrink-0 rounded-full bg-gotoap-hover" />
      <div className="max-w-[70%] space-y-1.5 rounded-2xl bg-gotoap-hover px-4 py-2.5">
        <span className="block h-3.5 w-32 rounded bg-gotoap-line" />
        <span className="block h-3.5 w-24 rounded bg-gotoap-line" />
        <span className="block h-3.5 w-20 rounded bg-gotoap-line" />
      </div>
    </div>
  );
}

export function ChatHistorySkeleton(): React.JSX.Element {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <LogoIcon size={48} className="text-gotoap-accent/30" />
    </div>
  );
}