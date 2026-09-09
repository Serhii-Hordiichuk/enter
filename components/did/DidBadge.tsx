'use client';

import { useState } from 'react';
import { CheckIcon, CopyIcon, KeyIcon } from '@/components/icons';

interface DidBadgeProps {
  did: string;
  compact?: boolean;
}

export function DidBadge({ did, compact = false }: DidBadgeProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const copyDid = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(did);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy the DID:', error);
    }
  };

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-gotoap-line bg-gotoap-hover/60 px-3 py-2">
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gotoap-accent/20 text-gotoap-accent">
        <KeyIcon size={15} />
      </span>
      <code className={'flex-1 font-mono text-xs text-gotoap-ink ' + (compact ? 'truncate' : 'break-all')}>{did}</code>
      <button
        type="button"
        onClick={() => void copyDid()}
        aria-label={copied ? 'DID copied' : 'Copy DID'}
        title={copied ? 'Copied' : 'Copy DID'}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gotoap-ink-muted transition hover:bg-gotoap-hover hover:text-gotoap-ink"
      >
        {copied ? <CheckIcon size={15} className="text-emerald-400" /> : <CopyIcon size={15} />}
      </button>
    </div>
  );
}
