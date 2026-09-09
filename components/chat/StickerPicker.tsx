'use client';

/** Custom sticker pack built from Gotoap icons (no external assets). */
import { useEffect, useRef, useState } from 'react';
import {
  ChatsIcon, CpuIcon, GlobeIcon, KeyIcon, LockIcon, LogoIcon, PinIcon, ShieldIcon, SparkIcon, StickerIcon,
} from '@/components/icons';

type IconComponent = (props: { size?: number; className?: string }) => React.JSX.Element;

export interface GotoapSticker { id: string; Component: IconComponent; }

export const STICKERS: readonly GotoapSticker[] = [
  { id: 'spark', Component: SparkIcon },
  { id: 'chat', Component: ChatsIcon },
  { id: 'shield', Component: ShieldIcon },
  { id: 'globe', Component: GlobeIcon },
  { id: 'cpu', Component: CpuIcon },
  { id: 'lock', Component: LockIcon },
  { id: 'key', Component: KeyIcon },
  { id: 'pin', Component: PinIcon },
  { id: 'logo', Component: LogoIcon },
] as const;

/** Resolves a sticker body (sticker:<id>) into its icon component. */
export function stickerById(id: string): GotoapSticker | null {
  return STICKERS.find((sticker) => sticker.id === id) ?? null;
}

interface StickerPickerProps {
  onPick: (stickerId: string) => void;
  disabled?: boolean;
}

export function StickerPicker({ onPick, disabled = false }: StickerPickerProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Pick a sticker"
        title="Stickers"
        disabled={disabled}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink disabled:opacity-40"
      >
        <StickerIcon size={21} />
      </button>
      {open ? (
        <div className="absolute bottom-full right-0 z-40 mb-2 w-64 rounded-2xl border border-gotoap-line bg-gotoap-panel p-3 shadow-2xl shadow-black/50">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gotoap-ink-muted">Gotoap pack</p>
          <div className="grid grid-cols-3 gap-1">
            {STICKERS.map(({ id, Component }) => (
              <button
                key={id}
                type="button"
                onClick={() => { onPick(id); setOpen(false); }}
                aria-label={'Send the ' + id + ' sticker'}
                className="flex h-20 w-full items-center justify-center rounded-xl p-4 text-gotoap-accent transition hover:scale-105 hover:bg-gotoap-hover"
              >
                <Component size={44} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
