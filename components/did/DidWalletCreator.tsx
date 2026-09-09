'use client';

import { useState } from 'react';
import { generateDIDKeyPair, storeDIDKeyPair, type DIDKeyPair } from '@/lib/did/keyGenerator';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface DidWalletCreatorProps {
  onCreated: (pair: DIDKeyPair) => void;
}

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
      <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-300">
        <li>A unique did:peer DID for P2P identification.</li>
        <li>Messages signed with your private key.</li>
        <li>History stays between browsers over WebRTC/WebTorrent.</li>
      </ul>
      {error ? <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
      <div className="mt-4">
        <Button onClick={handleCreate} disabled={busy}>{busy ? 'Generating...' : 'Create DID'}</Button>
      </div>
    </Card>
  );
}
