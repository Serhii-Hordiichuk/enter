'use client';

/** Inline call history for the sidebar Calls tab (no header chrome needed). */
import { useRouter } from 'next/navigation';
import { CallHistory } from '@/components/calls/CallHistory';

export function CallHistoryInline(): React.JSX.Element {
  const router = useRouter();
  return <CallHistory onStartCall={(peerDid) => router.push('/chat/' + encodeURIComponent(peerDid))} />;
}
