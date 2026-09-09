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
      console.error('Не вдалося створити DID-гаманець:', err);
      setError(err instanceof Error ? err.message : 'Не вдалося створити DID-гаманець');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Створіть децентралізовану особу" description="Ключі Ed25519 генеруються лише у вашому браузері та зберігаються локально. Жоден сервер їх не бачить.">
      <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-300">
        <li>Унікальний DID формату did:peer для P2P-ідентифікації.</li>
        <li>Підписи повідомлень приватним ключем.</li>
        <li>Історія лише між браузерами через WebRTC/WebTorrent.</li>
      </ul>
      {error ? <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
      <div className="mt-4">
        <Button onClick={handleCreate} disabled={busy}>{busy ? 'Генерація…' : 'Створити DID'}</Button>
      </div>
    </Card>
  );
}
