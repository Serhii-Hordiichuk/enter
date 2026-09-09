'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { MessageInput } from '@/components/chat/MessageInput';
import { AiAssistant } from '@/components/ai/AiAssistant';
import { decryptText, deriveRoomKey, encryptText, signMessageText, verifyMessageText, type EncryptedPayload } from '@/lib/crypto/encryption';
import { getStoredDIDKeyPair, publicKeyFromDid } from '@/lib/did/keyGenerator';
import { loadLocalHistory, torrentHistory } from '@/lib/p2p/torrentHistory';
import type { ChatWireMessage } from '@/lib/p2p/trysteroSetup';
import { webrtcManager } from '@/lib/p2p/webrtcManager';
import { useVortexStore } from '@/lib/store/useVortexStore';

interface ChatPageProps {
  params: { id: string };
}

function randomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map((item) => item.toString(16).padStart(2, '0')).join('');
}

/** Dynamic chat route: joins the P2P room, renders header, history, and composer. */
export default function ChatPage({ params }: ChatPageProps): React.JSX.Element {
  const roomId = useMemo(() => decodeURIComponent(params.id), [params.id]);
  const ensureDid = useVortexStore((state) => state.ensureDid);
  const ingestWireMessage = useVortexStore((state) => state.ingestWireMessage);
  const hydrateRoom = useVortexStore((state) => state.hydrateRoom);
  const setPeers = useVortexStore((state) => state.setPeers);
  const startRoom = useVortexStore((state) => state.startRoom);
  const [aiOpen, setAiOpen] = useState(false);
  const [magnet, setMagnet] = useState<string | null>(null);

  // Register the room and restore the decrypted local history into the UI.
  useEffect(() => {
    startRoom(roomId);
    void hydrateRoom(roomId);
  }, [roomId, startRoom, hydrateRoom]);

  // Join the P2P room and wire up peer and message events.
  useEffect(() => {
    let cancelled = false;
    let unsubscribeMessage: (() => void) | null = null;
    let unsubscribePeers: (() => void) | null = null;
    ensureDid();
    webrtcManager
      .join(roomId)
      .then(async () => {
        if (cancelled) return;
        const roomKey = await deriveRoomKey(roomId);
        if (cancelled) return;
        setPeers(roomId, webrtcManager.getPeerIds(roomId).map((peerId) => ({ peerId, connectedAt: Date.now() })));
        unsubscribeMessage = webrtcManager.onMessage(roomId, (wire, peerId) => {
          void (async (): Promise<void> => {
            try {
              const publicKey = publicKeyFromDid(wire.senderDid);
              const valid = verifyMessageText(wire.body, wire.signature, publicKey);
              if (!valid) {
                console.error('Received a message with an invalid signature from', peerId);
                return;
              }
              let plainBody = wire.body;
              if (wire.encrypted) {
                try {
                  plainBody = await decryptText(JSON.parse(wire.body) as EncryptedPayload, roomKey);
                } catch (decryptError) {
                  console.error('Failed to decrypt an incoming message:', decryptError);
                  plainBody = '(encrypted message)';
                }
              }
              ingestWireMessage(roomId, wire, plainBody, false);
            } catch (error) {
              console.error('Failed to process an incoming message:', error);
            }
          })();
        });
        unsubscribePeers = webrtcManager.onPeerEvent(roomId, () => {
          const peers = webrtcManager.getPeerIds(roomId).map((peerId) => ({ peerId, connectedAt: Date.now() }));
          setPeers(roomId, peers);
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) console.error('Failed to join the room ' + roomId + ':', error);
      });
    return () => {
      cancelled = true;
      unsubscribeMessage?.();
      unsubscribePeers?.();
      void webrtcManager.leave(roomId);
    };
  }, [roomId, ensureDid, ingestWireMessage, setPeers]);

  // Encrypt, sign, and send a message; then reseed the history torrent.
  const send = useCallback(
    async (text: string): Promise<void> => {
      const me = getStoredDIDKeyPair() ?? ensureDid();
      const key = await deriveRoomKey(roomId);
      const encrypted = await encryptText(text, key);
      const payload = JSON.stringify(encrypted);
      const signature = signMessageText(payload, me.secretKey);
      const wire: ChatWireMessage = { id: randomId(), senderDid: me.did, body: payload, timestamp: Date.now(), signature, encrypted: true };
      await webrtcManager.send(roomId, wire);
      ingestWireMessage(roomId, wire, text, true);
      try {
        setMagnet(await torrentHistory.seed(roomId, loadLocalHistory(roomId)));
      } catch (error) {
        console.error('History seeding failed (chat keeps working over WebRTC):', error);
      }
    },
    [roomId, ensureDid, ingestWireMessage],
  );

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <ChatHeader roomId={roomId} onOpenAi={() => setAiOpen(true)} />
      <ChatHistory roomId={roomId} />
      <MessageInput onSend={send} />
      <AiAssistant roomId={roomId} open={aiOpen} onClose={() => setAiOpen(false)} />
      {magnet ? <p className="hidden">{magnet}</p> : null}
    </div>
  );
}
