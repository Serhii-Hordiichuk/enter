'use client';
import { Dialog } from '@/components/ui/Dialog';
import { DidBadge } from '@/components/did/DidBadge';
import { ProfileEditor } from '@/components/profile/ProfileEditor';
import { useVortexStore } from '@/lib/store/useVortexStore';

export function ProfileDialog({ open, onClose }: { open: boolean; onClose: () => void }): React.JSX.Element | null {
  const did = useVortexStore((state) => state.currentDid?.did ?? null);
  if (!open) return null;
  return (
    <Dialog open={open} title="My profile" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {did ? <DidBadge did={did} /> : <p className="text-sm text-gotoap-ink-muted">No DID created yet.</p>}
        {did ? <ProfileEditor seed={did} onSaved={onClose} /> : null}
        <p className="text-xs text-gotoap-ink-faint">The profile is stored only in this browser and is never uploaded anywhere.</p>
      </div>
    </Dialog>
  );
}
