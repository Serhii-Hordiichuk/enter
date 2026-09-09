'use client';

/** Chat room page: P2P messaging, typing, receipts, media, and the AI panel. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatSearchOverlay } from '@/components/chat/ChatSearchOverlay';
import { AiAssistant } from '@/components/ai/AiAssistant';
import { ForwardDialog } from '@/components/chats/ForwardDialog';
import { PinIcon } from '@/components/icons';
import type { MessageActionKind } from '@/components/chat/MessageBubble';
import type { VortexMessage } from '@/lib/store/useVortexStore';
import { useVortexStore } from '@/lib/store/useVortexStore';
import { webrtcManager } from '@/lib/p2p/webrtcManager';
import { getStoredDIDKeyPair } from '@/lib/did/keyGenerator';
import { playMessageChime, requestNotificationPermission, showIncomingMessageNotification } from '@/lib/notifications';
import {
  broadcastProfile, deleteSentMessage, editSentMessage, forwardMessage, sendChatMessage,
  sendReadReceipts, sendTypingIndicator,
} from '@/lib/messaging/messenger';

export default function ChatPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const roomId = useMemo(() => decodeURIComponent(Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);

  const ensureDid = useVortexStore((state) => state.ensureDid);
  const startRoom = useVortexStore((state) => state.startRoom);
  const rooms = useVortexStore((state) => state.activeRooms);
  const profile = useVortexStore((state) => state.profile);
  const setPeers = useVortexStore((state) => state.setPeers);
  const hydrateRoom = useVortexStore((state) => state.hydrateRoom);
  const deleteRoom = useVortexStore((state) => state.deleteRoom);
  const messages = useVortexStore((state) => state.messages[roomId] ?? []);

  const [typingPeers, setTypingPeers] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [forwarding, setForwarding] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const typingTimers = useRef(new Map<string, number>());

  const room = rooms.find((item) => item.id === roomId) ?? null;
  const peerName = room?.title || (room?.peerDid ? room.peerDid.slice(0, 16) + '...' : roomId);

  // Register the room and hydrate the history once.
  useEffect(() => {
    try {
      ensureDid();
      startRoom(roomId);
      void hydrateRoom(roomId);
    } catch (error) {
      console.error('Failed to open the chat room:', error);
    }
  }, [roomId, ensureDid, startRoom, hydrateRoom]);

  // Join the P2P room, exchange profiles, and consume wire events.
  useEffect(() => {
    let disposed = false;
    const join = async (): Promise<void> => {
      try {
        await requestNotificationPermission();
        await webrtcManager.join(roomId);
        if (disposed) return;
        const me = getStoredDIDKeyPair();
        if (me) await broadcastProfile(roomId, { did: me.did, displayName: profile.displayName || undefined, bio: profile.bio || undefined, colorId: profile.colorId });
      } catch (error) {
        console.error('Failed to join the P2P room:', error);
      }
    };
    void join();
    const offMessage = webrtcManager.onMessage(roomId, (wire) => {
      if (wire.typing) {
        setTypingPeers((current) => (current.includes(wire.senderDid) ? current : [...current, wire.senderDid]));
        const previous = typingTimers.current.get(wire.senderDid);
        if (previous) window.clearTimeout(previous);
        typingTimers.current.set(wire.senderDid, window.setTimeout(() => {
          setTypingPeers((current) => current.filter((item) => item !== wire.senderDid));
        }, 3000));
        return;
      }
      if (Array.isArray(wire.receiptIds)) {
        for (const id of wire.receiptIds) {
          useVortexStore.getState().markViewed(roomId, id);
        }
        return;
      }
      if (wire.profile) {
        const name = wire.profile.displayName;
        if (name) useVortexStore.getState().setPeerProfile(wire.senderDid, { did: wire.senderDid, displayName: name, bio: wire.profile.bio, colorId: wire.profile.colorId });
        return;
      }
      if (typeof wire.body !== 'string' || !wire.id) return;
      const muted = useVortexStore.getState().activeRooms.find((item) => item.id === roomId)?.muted ?? false;
      if (!muted) {
        playMessageChime();
        const preview = wire.encrypted ? 'New encrypted message' : wire.body.slice(0, 120);
        showIncomingMessageNotification(peerName, preview, () => router.push('/chat/' + encodeURIComponent(roomId)));
      }
      void useVortexStore.getState().receiveWireMessage(roomId, wire);
      void sendReadReceipts(roomId, [wire.id]).catch(() => undefined);
    });
    const offPeers = webrtcManager.onPeerEvent(roomId, (event) => {
      const peerIds = webrtcManager.getPeerIds(roomId);
      setPeers(roomId, peerIds.map((peerId) => ({ peerId, connectedAt: Date.now() })));
      if (event.type === 'join') {
        const me = getStoredDIDKeyPair();
        if (me) void broadcastProfile(roomId, { did: me.did, displayName: profile.displayName || undefined, bio: profile.bio || undefined, colorId: profile.colorId });
      }
    });
    return () => {
      disposed = true;
      offMessage();
      offPeers();
    };
  }, [roomId, peerName, router, profile.displayName, profile.bio, profile.colorId, setPeers]);

  const refreshPeers = useCallback((): void => {
    setPeers(roomId, webrtcManager.getPeerIds(roomId).map((peerId) => ({ peerId, connectedAt: Date.now() })));
  }, [roomId, setPeers]);

  useEffect(() => {
    const timer = window.setInterval(refreshPeers, 4000);
    return () => window.clearInterval(timer);
  }, [refreshPeers]);

  const peerCount = webrtcManager.getPeerIds(roomId).length;

  // Mark incoming peer messages as viewed locally.
  useEffect(() => {
    const unread = messages.filter((message) => !message.mine && !message.viewed && !message.deletedAt);
    if (unread.length === 0) return;
    const timer = window.setTimeout(() => {
      for (const message of unread) useVortexStore.getState().markViewed(roomId, message.id);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [messages, roomId]);

  const handleSendText = useCallback((body: string, replyToId: string | null): void => {
    void sendChatMessage(roomId, body, { kind: 'text', replyToId }).catch((error) => console.error('Send failed:', error));
  }, [roomId]);

  const handleSendSticker = useCallback((stickerId: string): void => {
    void sendChatMessage(roomId, 'sticker:' + stickerId, { kind: 'sticker' }).catch((error) => console.error('Send failed:', error));
  }, [roomId]);

  const handleSendVoice = useCallback((dataUri: string, durationMs: number): void => {
    void sendChatMessage(roomId, 'Voice message', { kind: 'voice', media: { name: 'voice-note.webm', mime: 'audio/webm', dataUri, size: Math.round(dataUri.length * 0.75), durationMs } }).catch((error) => console.error('Send failed:', error));
  }, [roomId]);

  const handleSendFile = useCallback((name: string, mime: string, dataUri: string, size: number): void => {
    void sendChatMessage(roomId, name, { kind: 'file', media: { name, mime, dataUri, size } }).catch((error) => console.error('Send failed:', error));
  }, [roomId]);

  const handleEditSave = useCallback((messageId: string, body: string): void => {
    setEditing(null);
    void editSentMessage(roomId, messageId, body).catch((error) => console.error('Edit failed:', error));
  }, [roomId]);

  const handleTyping = useCallback((): void => {
    void sendTypingIndicator(roomId);
  }, [roomId]);

  const handleMessageAction = useCallback((action: MessageActionKind, message: VortexMessage): void => {
    const messageId = message.id;
    if (action === 'reply') setReplyTo(messageId);
    if (action === 'edit') setEditing(messageId);
    if (action === 'pin') setPinnedId((current) => (current === messageId ? null : messageId));
    if (action === 'delete') void deleteSentMessage(roomId, messageId).catch((error) => console.error('Delete failed:', error));
    if (action === 'forward') setForwarding(messageId);
    if (action === 'copy') void navigator.clipboard.writeText(message.body).catch((error) => console.error('Copy failed:', error));
  }, [roomId]);

  const pinnedMessage = pinnedId ? messages.find((message) => message.id === pinnedId) ?? null : null;
  return (
    <div className="gotoap-chat-bg relative flex h-full min-h-0">
      <section className="flex h-full min-w-0 flex-1 flex-col">
        <ChatHeader
          roomId={roomId}
          peerCount={peerCount}
          peerName={peerName}
          typingPeers={typingPeers}
          aiBusy={false}
          aiPanelOpen={aiPanelOpen}
          onOpenSearch={() => setSearchOpen(true)}
          onToggleAiPanel={() => setAiPanelOpen((value) => !value)}
          onBack={() => router.push('/')}
          onLeave={() => {
            deleteRoom(roomId);
            void webrtcManager.leave(roomId);
            router.push('/');
          }}
        />
        {pinnedMessage ? (
          <div className="flex items-center gap-2 border-b border-gotoap-line bg-gotoap-panel/90 px-4 py-1.5 text-[13px]">
            <PinIcon size={14} className="shrink-0 text-gotoap-accent" />
            <span className="truncate text-gotoap-ink-muted">{pinnedMessage.body.slice(0, 120)}</span>
            <button type="button" onClick={() => setPinnedId(null)} className="ml-auto text-xs text-gotoap-accent hover:underline">Unpin</button>
          </div>
        ) : null}
        <ChatHistory roomId={roomId} onAction={handleMessageAction} />
        <MessageInput
          onSendText={handleSendText}
          onSendSticker={handleSendSticker}
          onSendVoice={handleSendVoice}
          onSendFile={handleSendFile}
          onEditSave={handleEditSave}
          onTyping={handleTyping}
          replyTo={replyTo ? messages.find((message) => message.id === replyTo) ?? null : null}
          editing={editing ? messages.find((message) => message.id === editing) ?? null : null}
          onCancelReply={() => setReplyTo(null)}
          onCancelEdit={() => setEditing(null)}
        />
      </section>
      {aiPanelOpen ? <AiAssistant roomId={roomId} open onClose={() => setAiPanelOpen(false)} /> : null}
      {searchOpen ? <ChatSearchOverlay roomId={roomId} onJumpTo={() => undefined} onClose={() => setSearchOpen(false)} /> : null}
      <ForwardDialog
        open={forwarding !== null}
        excludeRoomId={forwarding ? roomId : null}
        onClose={() => setForwarding(null)}
        onForward={(targetRoomId) => {
          const source = forwarding ? messages.find((message) => message.id === forwarding) : null;
          if (source) void forwardMessage(targetRoomId, source.body, source.kind, source.media ?? null).catch((error) => console.error('Forward failed:', error));
          setForwarding(null);
        }}
      />
    </div>
  );
}
