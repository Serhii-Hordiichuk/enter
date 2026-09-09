'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AiToggle } from '@/components/ai/AiToggle';
import { DidBadge } from '@/components/did/DidBadge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { clearStoredDIDKeyPair, getStoredDIDKeyPair, type DIDKeyPair } from '@/lib/did/keyGenerator';
import { useVortexStore, type AiMode } from '@/lib/store/useVortexStore';

export default function SettingsPage(): React.JSX.Element {
  const aiMode = useVortexStore((state) => state.aiMode);
  const switchAiMode = useVortexStore((state) => state.switchAiMode);
  const apiKey = useVortexStore((state) => state.apiKey);
  const setApiKey = useVortexStore((state) => state.setApiKey);
  const [did, setDid] = useState<DIDKeyPair | null>(null);
  const [draftKey, setDraftKey] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => { setDid(getStoredDIDKeyPair()); setDraftKey(apiKey ?? ''); }, [apiKey]);

  const saveKey = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setApiKey(draftKey.trim().length > 0 ? draftKey.trim() : null);
    setNotice('API key saved locally in this browser.');
  };

  const resetDid = (): void => {
    clearStoredDIDKeyPair();
    setDid(null);
    setNotice('DID removed from this browser. Create a new one on the home page.');
  };

  const changeMode = (mode: AiMode): void => { switchAiMode(mode); setNotice(mode === 'local' ? 'Local AI enabled (WebGPU, Llama-3.2-1B).' : 'API mode enabled via /api/ai-proxy.'); };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <header>
        <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-100">Back home</Link>
        <h1 className="mt-1 text-2xl font-bold text-zinc-50">Settings</h1>
      </header>
      {notice ? <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</p> : null}
      <Card title="AI mode" description="Local mode runs fully in the browser. API mode goes through the server-side Edge proxy, where provider keys are stored.">
        <AiToggle mode={aiMode} onChange={changeMode} />
      </Card>
      <Card title="Public DID" description="Your decentralized identifier. Share it with a peer to start a chat.">
        {did ? <DidBadge did={did.did} /> : <p className="text-sm text-zinc-500">No DID created yet.</p>}
        {did ? <div className="mt-3"><Button variant="danger" size="sm" onClick={resetDid}>Remove DID from browser</Button></div> : null}
      </Card>
      <Card title="Local API key (optional)" description="Stored only in localStorage and used for direct provider calls if you prefer not to use the server proxy.">
        <form onSubmit={saveKey} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1"><Input label="API key" type="password" value={draftKey} onChange={(event) => setDraftKey(event.target.value)} placeholder="sk-..." autoComplete="off" /></div>
          <Button type="submit">Save</Button>
        </form>
      </Card>
    </main>
  );
}
