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
    setNotice('API-ключ збережено локально у цьому браузері.');
  };

  const resetDid = (): void => {
    clearStoredDIDKeyPair();
    setDid(null);
    setNotice('DID видалено з цього браузера. Створіть новий на головній сторінці.');
  };

  const changeMode = (mode: AiMode): void => { switchAiMode(mode); setNotice(mode === 'local' ? 'Увімкнено локальний ШІ (WebGPU, Llama-3.2-1B).' : 'Увімкнено API-режим через /api/ai-proxy.'); };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <header>
        <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-100">← На головну</Link>
        <h1 className="mt-1 text-2xl font-bold text-zinc-50">Налаштування</h1>
      </header>
      {notice ? <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</p> : null}
      <Card title="Режим ШІ" description="Локальний режим працює повністю офлайн-орієнтовано у браузері. API-режим іде через серверний Edge-проксі, де зберігаються ключі провайдера.">
        <AiToggle mode={aiMode} onChange={changeMode} />
      </Card>
      <Card title="Публічний DID" description="Ваш децентралізований ідентифікатор. Передайте його співрозмовнику для старту чату.">
        {did ? <DidBadge did={did.did} /> : <p className="text-sm text-zinc-500">DID ще не створено.</p>}
        {did ? <div className="mt-3"><Button variant="danger" size="sm" onClick={resetDid}>Видалити DID з браузера</Button></div> : null}
      </Card>
      <Card title="Локальний API-ключ (опційно)" description="Зберігається лише у localStorage і використовується для прямих викликів провайдерів, якщо ви не хочете йти через серверний проксі.">
        <form onSubmit={saveKey} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1"><Input label="API-ключ" type="password" value={draftKey} onChange={(event) => setDraftKey(event.target.value)} placeholder="sk-…" autoComplete="off" /></div>
          <Button type="submit">Зберегти</Button>
        </form>
      </Card>
    </main>
  );
}
