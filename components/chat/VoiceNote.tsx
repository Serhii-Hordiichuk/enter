'use client';

/** Inline voice message player with progress and duration. */
import { useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon } from '@/components/icons';
import type { MessageMedia } from '@/lib/store/useVortexStore';

interface VoiceNoteProps {
  media: MessageMedia;
  outgoing: boolean;
}

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
}

export function VoiceNote({ media, outgoing }: VoiceNoteProps): React.JSX.Element {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(media.durationMs ?? 0);
  const [error, setError] = useState(false);

  useEffect(() => () => { try { audioRef.current?.pause(); } catch { /* ignored */ } }, []);

  const toggle = (): void => {
    const audio = audioRef.current;
    if (!audio || error) return;
    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        void audio.play().then(() => setPlaying(true)).catch((playError: unknown) => {
          console.error('Failed to play the voice note:', playError);
          setError(true);
        });
      }
    } catch (playError) {
      console.error('Voice playback error:', playError);
      setError(true);
    }
  };

  const progress = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  const trackColor = outgoing ? 'rgba(255,255,255,0.25)' : 'rgba(112,132,153,0.35)';

  return (
    <div className="flex min-w-[180px] items-center gap-2.5 py-1">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause the voice note' : 'Play the voice note'}
        className={'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ' + (outgoing ? 'bg-white/20 text-white' : 'bg-gotoap-accent text-white')}
      >
        {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} className={error ? 'opacity-50' : ''} />}
      </button>
      <div className="flex-1">
        <div className="h-1 w-full rounded-full" style={{ background: trackColor }}>
          <div className={'h-1 rounded-full transition-all ' + (outgoing ? 'bg-white' : 'bg-gotoap-accent')} style={{ width: progress + '%' }} />
        </div>
        <span className={'mt-1 block text-[11px] ' + (outgoing ? 'text-white/70' : 'text-gotoap-ink-muted')}>
          {formatDuration(position > 0 ? position : duration || 0)}
        </span>
      </div>
      <audio
        ref={audioRef}
        src={media.dataUri}
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime * 1000)}
        onLoadedMetadata={(event) => { if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration * 1000); }}
        onEnded={() => { setPlaying(false); setPosition(0); }}
        preload="metadata"
        className="hidden"
      />
    </div>
  );
}
