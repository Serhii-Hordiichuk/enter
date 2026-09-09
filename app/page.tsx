'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DidBadge } from '@/components/did/DidBadge';
import { DidWalletCreator } from '@/components/did/DidWalletCreator';
import { getStoredDIDKeyPair, type DIDKeyPair } from '@/lib/did/keyGenerator';
import { useVortexStore } from '@/lib/store/useVortexStore';

export default function HomePage(): React.JSX.Element {
  const router = useRouter();
  const activeRooms = useVortexStore((state) => state.activeRooms);
  const startRoom = useVortexStore((state) => state.startRoom);
  const [did, setDid] = useState<DIDKeyPair | null>(null);
  const [peerDid, setPeerDid] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setDid(getStoredDIDKeyPair()); }, []);

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const value = peerDid.trim();
    if (!value) { setError('Введіть DID співрозмовника або назву кімнати'); return; }
    try {
      const roomId = startRoom(value, value.startsWith('did:peer:') ? value : null);
      setError(null);
      router.push('/chat/' + encodeURIComponent(roomId));
    } catch (err) {
      console.error('Не вдалося створити чат:', err);
      setError(err instanceof Error ? err.message : 'Не вдалося створити чат');
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 py-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50">Готоап</h1>
          <p className="mt-1 text-sm text-zinc-400">Децентралізований P2P-месенджер без серверів зберігання. WebRTC + WebTorrent + DID + ШІ.</p>
        </div>
        <Link href="/settings" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">Налаштування</Link>
      </header>
      {!did ? <DidWalletCreator onCreated={(pair) => setDid(pair)} /> : (
        <>
          <DidBadge did={did.did} />
          <Card title="Почати чат" description="Введіть DID співрозмовника або спільну назву кімнати. Обидва піри мають ввести однакову назву.">
            <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1"><Input label="DID або кімната" value={peerDid} onChange={(event) => setPeerDid(event.target.value)} placeholder="did:peer:z… або секретна-кімната-42" error={error} /></div>
              <Button type="submit">Почати чат</Button>
            </form>
          </Card>
          <Card title="Активні чати" description="Зберігаються лише локально у вашому браузері.">
            {activeRooms.length === 0 ? <p className="text-sm text-zinc-500">Ще немає чатів.</p> : (
              <ul className="divide-y divide-zinc-800">
                {activeRooms.map((room) => (
                  <li key={room.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm text-zinc-100">{room.id}</p>
                      <p className="text-xs text-zinc-500">Оновлено {new Date(room.lastMessageAt).toLocaleString('uk-UA')}</p>
                    </div>
                    <Link href={'/chat/' + encodeURIComponent(room.id)} className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-700">Відкрити</Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </main>
  );
}
