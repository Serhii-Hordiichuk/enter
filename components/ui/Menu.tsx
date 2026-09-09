'use client';

/** Custom dropdown menu with outside-click and Escape handling. */
import { useEffect, useRef } from 'react';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onSelect: () => void;
}

interface MenuProps {
  open: boolean;
  items: MenuItem[];
  onClose: () => void;
  align?: 'left' | 'right';
}

export function Menu({ open, items, onClose, align = 'right' }: MenuProps): React.JSX.Element | null {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent): void => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div ref={rootRef} role="menu" className={'absolute top-full z-40 mt-1.5 min-w-[210px] overflow-hidden rounded-xl border border-gotoap-line bg-gotoap-panel py-1 shadow-2xl shadow-black/50 ' + (align === 'right' ? 'right-0' : 'left-0')}>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          onClick={() => { item.onSelect(); onClose(); }}
          className={'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition hover:bg-gotoap-hover ' + (item.danger ? 'text-red-400' : 'text-gotoap-ink')}
        >
          {item.icon ? <span className="text-gotoap-ink-muted">{item.icon}</span> : null}
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
