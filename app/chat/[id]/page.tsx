'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AiAssistant } from '@/components/ai/AiAssistant';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { MessageInput } from '@/components/chat/MessageInput';
import { deriveRoomKey, encryptText, signMessageText, verifyMessageText } from '@/lib/crypto/encryption';
import { getStoredDIDKeyPair, publicKeyFromDid } from '@/lib/did/keyGenerator';
import { saveLocalHistory, torrentHistory } from '@/lib/p2p/torrentHistory';
import type { ChatWireMessage } from '@/lib/p2p/trysteroSetup';
import { webrtcManager } from '@/lib/p2p/webrtcManager';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface ChatPageProps { params: Promise<{ id: string }>; }

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map((item) => item.toString(16).padStart(2, '0')).join('');
}

export default function ChatPage({ params }: ChatPageProps): React.JSX.Element {
  const { id } = use(params);
  const roomId = useMemo(() => decodeURIComponent(id), [id]);
  const ensureDid = useVortexStore((state) => state.ensureDid);
  const ingestWireMessage = useVortexStore((state) => state.ingestWireMessage);
  const setPeers = useVortexStore((state) => state.setPeers);
  const startRoom = useVortexStore((state) => state.startRoom);
  const [magnet, setMagnet] = useState<string | null>(null);
  const [peerCount, setPeerCount] = useState(0);
  const [status, setStatus] = useState('Підключення…');

  useEffect(() => {
    let cancelled = false;
    let unsubscribeMessage: (() => void) | null = null;
    let unsubscribePeers: (() => void) | null = null;
    startRoom(roomId);
    ensureDid();
    setStatus('Підключення через WebTorrent-трекери…');
    webrtcManager.join(roomId).then(() => {
      if (cancelled) return;
      setStatus('Очікування пірів у кімнаті ' + roomId);
      setPeerCount(webrtcManager.getPeerIds(roomId).length);
      unsubscribeMessage = webrtcManager.onMessage(roomId, (wire, peerId) => {
        try {
          const publicKey = publicKeyFromDid(wire.senderDid);
          const valid = verifyMessageText(wire.body, wire.signature, publicKey);
          if (!valid) { console.error('Отримано повідомлення з недійсним підписом від', peerId); return; }
          ingestWireMessage(roomId, wire, false);
        } catch (error) { console.error('Не вдалося обробити вхідне повідомлення:', error); }
      });
      unsubscribePeers = webrtcManager.onPeerEvent(roomId, () => {
        const peers = webrtcManager.getPeerIds(roomId).map((peerId) => ({ peerId, connectedAt: Date.now() }));
        setPeers(roomId, peers);
        setPeerCount(peers.length);
      });
    }).catch((error: unknown) => { if (!cancelled) setStatus(error instanceof Error ? error.message : 'Не вдалося підключитись'); });
    return () => { cancelled = true; unsubscribeMessage?.(); unsubscribePeers?.(); void webrtcManager.leave(roomId); };
  }, [roomId, ensureDid, ingestWireMessage, setPeers, startRoom]);

  const send = useCallback(async (text: string): Promise<void> => {
    const me = getStoredDIDKeyPair() ?? ensureDid();
    const key = await deriveRoomKey(roomId);
    const encrypted = await encryptText(text, key);
    const payload = JSON.stringify(encrypted);
    const signature = signMessageText(payload, me.secretKey);
    const wire: ChatWireMessage = { id: randomId(), senderDid: me.did, body: payload, timestamp: Date.now(), signature, encrypted: true };
    await webrtcManager.send(roomId, wire);
    ingestWireMessage(roomId, wire, true);
    const history = useVortexStore.getState().messages[roomId] ?? [];
    const snapshot = history.map((item) => ({ id: item.id, senderDid: item.senderDid, body: item.body, timestamp: item.timestamp, signature: item.signature, encrypted: item.encrypted }));
    saveLocalHistory(roomId, snapshot);
    try { setMagnet(await torrentHistory.seed(roomId, snapshot)); }
    catch (error) { console.error('Сідування історії не вдалося (чат продовжує працювати через WebRTC):', error); }
  }, [roomId, ensureDid, ingestWireMessage]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-100">← Усі чати</Link>
          <h1 className="truncate font-mono text-lg text-zinc-50">{roomId}</h1>
          <p className="text-xs text-zinc-500">{status} • пірів онлайн: {peerCount}</p>
          {magnet ? <p className="truncate text-[11px] text-zinc-600">magnet: {magnet.slice(0, 80)}…</p> : null}
        </div>
        <Link href="/settings" className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">ШІ</Link>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
        <ChatHistory roomId={roomId} />
        <MessageInput onSend={send} />
      </div>
      <div className="mt-3"><AiAssistant roomId={roomId} /></div>
      <p className="mt-3 text-[11px] text-zinc-600">Повідомлення шифруються AES-GCM ключем кімнати, підписуються Ed25519 і передаються напряму між браузерами. Історія також сідується як WebTorrent-торрент.</p>
    </main>
  );
}
