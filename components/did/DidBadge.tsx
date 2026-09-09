'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

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
    <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">ID</span>
      <code className={'flex-1 font-mono text-xs text-zinc-200 ' + (compact ? 'truncate' : 'break-all')}>{did}</code>
      <Button size="sm" variant="secondary" onClick={() => void copyDid()}>{copied ? 'Copied' : 'Copy'}</Button>
    </div>
  );
}
