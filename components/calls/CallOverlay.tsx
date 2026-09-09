'use client';

/** Full-screen call overlay: remote video, local PiP, and call controls. */
import { useEffect, useRef, useState } from 'react';
import { callManager } from '@/lib/calls/callManager';
import { MicIcon, MicOffIcon, MonitorIcon, PhoneIcon, PhoneOffIcon, VideoIcon, VideoOffIcon } from '@/components/icons';
import type { CallState } from '@/lib/calls/callManager';

interface CallOverlayProps {
  state: CallState;
  onAccept: () => void;
  onReject: () => void;
  onHangup: () => void;
}

function formatCallDuration(startedAt: number | null): string {
  if (!startedAt) return '';
  const total = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
}

export function CallOverlay({ state, onAccept, onReject, onHangup }: CallOverlayProps): React.JSX.Element {
  const remoteRef = useRef<HTMLVideoElement | null>(null);
  const localRef = useRef<HTMLVideoElement | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = state.remoteStream;
  }, [state.remoteStream]);

  useEffect(() => {
    if (localRef.current) localRef.current.srcObject = state.localStream;
  }, [state.localStream]);

  useEffect(() => {
    if (state.status !== 'active') return;
    const timer = window.setInterval(() => setElapsed(formatCallDuration(state.startedAt)), 1000);
    return () => window.clearInterval(timer);
  }, [state.status, state.startedAt]);

  const statusLabel = state.status === 'incoming' ? 'Incoming call...' : state.status === 'outgoing' ? 'Ringing...' : state.status === 'active' ? elapsed || 'Connected' : '';
  const mediaError = state.error;
  const ringing = state.status === 'incoming' || state.status === 'outgoing';

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#0b1016]/95 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={state.video ? 'Video call' : 'Audio call'}>
      {state.video ? (
        <video ref={remoteRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover opacity-90" />
      ) : null}
      {!state.video || !state.remoteStream ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <span className={'inline-flex h-28 w-28 items-center justify-center rounded-full bg-gotoap-accent/20 text-gotoap-accent ' + (ringing ? 'animate-pulse' : '')}>
            <PhoneIcon size={52} />
          </span>
          <p className="text-lg font-semibold text-gotoap-ink">{state.peerDid ? state.peerDid.slice(0, 20) + '...' : 'Peer'}</p>
        </div>
      ) : null}
      {state.video && state.localStream ? (
        <video ref={localRef} autoPlay playsInline muted className="absolute right-4 top-4 z-10 h-40 w-28 rounded-2xl border border-white/10 object-cover shadow-2xl sm:h-48 sm:w-36" />
      ) : null}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-end gap-6 pb-10 pt-16">
        <div className="text-center">
          <p className="text-sm text-gotoap-ink-muted">{state.video ? 'Video call' : 'Audio call'}</p>
          <p className="text-lg font-semibold text-gotoap-ink">{statusLabel}</p>
          {mediaError ? <p className="mt-1 text-sm text-red-300">{mediaError}</p> : null}
        </div>
        {state.status === 'incoming' ? (
          <div className="flex items-center gap-8">
            <button type="button" onClick={onReject} aria-label="Reject the call" className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition hover:bg-red-500">
              <PhoneOffIcon size={26} />
            </button>
            <button type="button" onClick={onAccept} aria-label="Accept the call" className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl transition hover:bg-emerald-500">
              <PhoneIcon size={26} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMicMuted(callManager.toggleMic())}
              aria-label={micMuted ? 'Unmute the microphone' : 'Mute the microphone'}
              aria-pressed={micMuted}
              className={'inline-flex h-12 w-12 items-center justify-center rounded-full transition ' + (micMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20')}
            >
              {micMuted ? <MicOffIcon size={20} /> : <MicIcon size={20} />}
            </button>
            {state.video ? (
              <button
                type="button"
                onClick={() => setCameraOff(callManager.toggleCamera())}
                aria-label={cameraOff ? 'Turn the camera on' : 'Turn the camera off'}
                aria-pressed={cameraOff}
                className={'inline-flex h-12 w-12 items-center justify-center rounded-full transition ' + (cameraOff ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20')}
              >
                {cameraOff ? <VideoOffIcon size={20} /> : <VideoIcon size={20} />}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void callManager.toggleScreenShare().then(setSharing)}
              aria-label={sharing ? 'Stop the screen share' : 'Share the screen'}
              aria-pressed={sharing}
              className={'inline-flex h-12 w-12 items-center justify-center rounded-full transition ' + (sharing ? 'bg-gotoap-accent text-white' : 'bg-white/10 text-white hover:bg-white/20')}
            >
              <MonitorIcon size={20} />
            </button>
            <button type="button" onClick={onHangup} aria-label="End the call" className="ml-2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-xl transition hover:bg-red-500">
              <PhoneOffIcon size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
