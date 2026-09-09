'use client';

import { useState } from 'react';
import { generateDIDKeyPair, storeDIDKeyPair, type DIDKeyPair } from '@/lib/did/keyGenerator';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChatsIcon, KeyIcon, ShieldIcon } from '@/components/icons';

interface DidWalletCreatorProps {
  onCreated: (pair: DIDKeyPair) => void;
}

const FEATURES = [
  { icon: <KeyIcon size={16} />, text: 'A unique did:peer DID for P2P identification.' },
  { icon: <ShieldIcon size={16} />, text: 'Messages signed with your private key.' },
  { icon: <ChatsIcon size={16} />, text: 'History stays between browsers over WebRTC/WebTorrent.' },
] as const;

export function DidWalletCreator({ onCreated }: DidWalletCreatorProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = (): void => {
    setBusy(true);
    setError(null);
    try {
      const pair = generateDIDKeyPair();
      storeDIDKeyPair(pair);
      onCreated(pair);
    } catch (err) {
      console.error('Failed to create the DID wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to create the DID wallet');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Create your decentralized identity" description="Ed25519 keys are generated only in your browser and stored locally. No server ever sees them.">
      <ul className="flex flex-col gap-2.5">
        {FEATURES.map((feature) => (
          <li key={feature.text} className="flex items-center gap-3 text-sm text-gotoap-ink">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gotoap-accent/15 text-gotoap-accent">{feature.icon}</span>
            <span className="text-gotoap-ink-muted">{feature.text}</span>
          </li>
        ))}
      </ul>
      {error ? <p className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
      <div className="mt-4">
        <Button onClick={handleCreate} disabled={busy} className="w-full">{busy ? 'Generating...' : 'Create DID wallet'}</Button>
      </div>
    </Card>
  );
}
