'use client';

/** Modal dialog for browsing shared media (photos, videos, files, links) in a chat. */
import { CloseIcon } from '@/components/icons';
import { SharedMedia } from '@/components/chat/SharedMedia';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface SharedMediaDialogProps {
  open: boolean;
  roomId: string;
  onClose: () => void;
}

export function SharedMediaDialog({ open, roomId, onClose }: SharedMediaDialogProps): React.JSX.Element | null {
  const messages = useVortexStore((state) => state.messages[roomId] ?? []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close shared media"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <div className="relative z-10 flex h-[80dvh] w-full max-w-2xl flex-col rounded-2xl border border-gotoap-line bg-gotoap-panel shadow-2xl">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gotoap-line">
          <h2 className="text-lg font-semibold text-gotoap-ink">Shared Media</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink"
          >
            <CloseIcon size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-hidden">
          <SharedMedia messages={messages} />
        </div>
      </div>
    </div>
  );
}