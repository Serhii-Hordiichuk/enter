'use client';

/** Call history: list of past incoming, outgoing, and missed calls. */
import { useMemo } from 'react';
import { Avatar } from '@/components/profile/Avatar';
import { CallsIcon, IncomingCallIcon, MissedCallIcon, OutgoingCallIcon, PhoneIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';

export interface CallEntry {
  id: string;
  peerDid: string;
  peerName?: string;
  type: 'incoming' | 'outgoing' | 'missed';
  video: boolean;
  startedAt: number;
  durationMs: number;
}

function formatCallTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  if (total < 60) return total + 's';
  return Math.floor(total / 60) + 'm ' + (total % 60) + 's';
}

export function CallHistory({ onStartCall }: { onStartCall: (peerDid: string, video: boolean) => void }): React.JSX.Element {
  const callHistory = useVortexStore((state) => state.callHistory);
  const peerProfiles = useVortexStore((state) => state.peerProfiles);

  const sorted = useMemo(() => [...callHistory].sort((a, b) => b.startedAt - a.startedAt), [callHistory]);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gotoap-hover text-gotoap-ink-muted">
          <CallsIcon size={32} />
        </span>
        <p className="text-sm font-medium text-gotoap-ink">No calls yet</p>
        <p className="max-w-xs text-xs text-gotoap-ink-muted">Your call history will appear here.</p>
      </div>
    );
  }

  return (
    <nav className="gotoap-scroll flex-1 overflow-y-auto px-2 pb-3" aria-label="Call history">
      <div className="flex flex-col gap-0.5">
        {sorted.map((call) => {
          const profile = peerProfiles[call.peerDid];
          const Icon = call.type === 'incoming' ? IncomingCallIcon : call.type === 'outgoing' ? OutgoingCallIcon : MissedCallIcon;
          return (
            <div key={call.id} className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-gotoap-hover">
              <Avatar seed={call.peerDid} name={profile?.displayName} size={48} />
              <div className="min-w-0 flex-1">
                <p className={'truncate text-[15px] font-medium ' + (call.type === 'missed' ? 'text-red-400' : 'text-gotoap-ink')}>{profile?.displayName || call.peerDid.slice(0, 18) + '...'}</p>
                <p className="flex items-center gap-1 truncate text-xs text-gotoap-ink-muted">
                  <Icon size={12} />
                  {call.type === 'missed' ? 'Missed' : call.type === 'incoming' ? 'Incoming' : 'Outgoing'}
                  {call.video ? ' video' : ' audio'}
                  {call.durationMs > 0 ? ' - ' + formatDuration(call.durationMs) : ''}
                  {' - ' + formatCallTime(call.startedAt)}
                </p>
              </div>
              <button type="button" onClick={() => onStartCall(call.peerDid, call.video)} aria-label="Call back" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gotoap-accent transition hover:bg-gotoap-hover">
                <PhoneIcon size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
