'use client';

/** Картка запрошення: покажи свій @нік другу — це весь "конект" у 1 крок. */
import { useState } from 'react';
import { CheckIcon, CopyIcon } from '@/components/icons';
import { useVortexStore } from '@/lib/store/useVortexStore';

export function InviteCard({ compact = false }: { compact?: boolean }): React.JSX.Element {
  const myDid = useVortexStore((state) => state.currentDid?.did ?? '');
  const username = useVortexStore((state) => state.profile.username);
  const displayName = useVortexStore((state) => state.profile.displayName);
  const [copied, setCopied] = useState<'nick' | 'did' | null>(null);

  const copy = (text: string, kind: 'nick' | 'did'): void => {
    try {
      void navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied((c) => (c === kind ? null : c)), 1500);
    } catch (error) {
      console.error('Failed to copy invite:', error);
    }
  };

  const nickText = username ? '@' + username : '';

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-gotoap-line bg-gotoap-panel p-3">
      <p className="text-sm font-semibold text-gotoap-ink">Як зв’язатись зі мною — 10 секунд</p>
      <p className="text-xs text-gotoap-ink-muted">Друг вводить твій @нік у пошук і тисне «Написати». Все.</p>
      <div className="flex flex-col gap-1.5">
        <button type="button" disabled={!nickText} onClick={() => nickText && copy(nickText, 'nick')} className="flex w-full items-center gap-2 rounded-xl bg-gotoap-hover px-3 py-2 text-left transition hover:opacity-90 disabled:opacity-50">
          <span className="min-w-0 flex-1 truncate font-mono text-sm text-gotoap-ink">{nickText || 'Спочатку задай @нік у профілі'}</span>
          {copied === 'nick' ? <CheckIcon size={15} className="shrink-0 text-emerald-400" /> : <CopyIcon size={15} className="shrink-0 text-gotoap-ink-muted" />}
        </button>
        {!compact ? (
          <button type="button" onClick={() => myDid && copy(myDid, 'did')} className="flex w-full items-center gap-2 rounded-xl bg-gotoap-hover px-3 py-2 text-left transition hover:opacity-90">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-gotoap-ink-muted">{myDid}</span>
            {copied === 'did' ? <CheckIcon size={15} className="shrink-0 text-emerald-400" /> : <CopyIcon size={15} className="shrink-0 text-gotoap-ink-muted" />}
          </button>
        ) : null}
      </div>
      <p className="truncate text-xs text-gotoap-ink-faint">{displayName ? displayName + ' · ' : ''}DID — запасний варіант, якщо ніку нема.</p>
    </div>
  );
}
