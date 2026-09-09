'use client';
import { useRouter } from 'next/navigation';
import { CallHistory } from '@/components/calls/CallHistory';
import { useVortexStore } from '@/lib/store/useVortexStore';
import { callManager } from '@/lib/calls/callManager';

export default function CallsPage(): React.JSX.Element {
  const router = useRouter();
  const startRoom = useVortexStore((state) => state.startRoom);
  const handleStartCall = (peerDid: string, video: boolean): void => {
    try { const roomId = startRoom(peerDid, peerDid); void callManager.start(roomId, video); router.push('/chat/' + encodeURIComponent(roomId)); } catch (error) { console.error('Failed to start call:', error); }
  };
  return (
    <div className="flex h-full min-h-0 flex-col bg-gotoap-bg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gotoap-line bg-gotoap-panel px-4">
        <button type="button" onClick={() => router.push('/')} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-ink-muted hover:bg-gotoap-hover hover:text-gotoap-ink">←</button>
        <h1 className="text-base font-semibold text-gotoap-ink">Calls</h1>
      </header>
      <CallHistory onStartCall={handleStartCall} />
    </div>
  );
}
