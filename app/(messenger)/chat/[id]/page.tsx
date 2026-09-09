'use client';

/** Chat room page: P2P messaging, typing, receipts, media, reactions, and the AI panel. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatSearchOverlay } from '@/components/chat/ChatSearchOverlay';
import { AiAssistant } from '@/components/ai/AiAssistant';
import { ChatProfilePanel } from "@/components/chat/ChatProfilePanel";
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
  sendReadReceipts, sendReaction, sendTypingIndicator,
} from '@/lib/messaging/messenger';

export default function ChatPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const roomId = useMemo(() => decodeURIComponent(Array.isArray(params.id) ? params.id[0] : params.id), [params.id]);

  const ensureDid = useVortexStore((state) => state.ensureDid);
  const startRoom = useVortexStore((state) => state.startRoom);
  const rooms = useVortexStore((state) => state.activeRooms);
  const profile = useVortexStore((state) => state.profile);
  const currentDid = useVortexStore((state) => state.currentDid);
  const setPeers = useVortexStore((state) => state.setPeers);
  const hydrateRoom = useVortexStore((state) => state.hydrateRoom);
  const deleteRoom = useVortexStore((state) => state.deleteRoom);
  const toggleReaction = useVortexStore((state) => state.toggleReaction);
  const messages = useVortexStore((state) => state.messages[roomId] ?? []);

  const [typingPeers, setTypingPeers] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [forwarding, setForwarding] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const typingTimers = useRef(new Map<string, number>());

  const room = rooms.find((item) => item.id === roomId) ?? null;
  const peerName = room?.title || (room?.peerDid ? room.peerDid.slice(0, 16) + '...' : roomId);
  const myDid = currentDid?.did ?? getStoredDIDKeyPair()?.did ?? 'anonymous';
  const peerCount = useVortexStore((state) => (state.peers[roomId] ?? []).length);

  useEffect(() => {
    try {
      ensureDid();
      startRoom(roomId);
      void hydrateRoom(roomId);
    } catch (error) {
      console.error('Failed to open the chat room:', error);
    }
  }, [roomId, ensureDid, startRoom, hydrateRoom]);

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
        console.error('Failed to join the P2P room', error);
      }
    };
    void join();
    return () => { disposed = true; };
  }, [roomId, profile]);

  useEffect(() => {
    const offPeer = webrtcManager.onPeerEvent(roomId, (event) => {
      const peers = webrtcManager.getPeerIds(roomId).map((peerId) => ({ peerId, connectedAt: Date.now() }));
      setPeers(roomId, peers);
      if (event.type === 'join' && peers.length > 0) {
        void sendReadReceipts(roomId, peers.map((peer) => peer.peerId));
      }
    });
    const offMessage = webrtcManager.onMessage(roomId, async (payload, peerId) => {
      try {
        if (payload.typing) {
          setTypingPeers((current) => Array.from(new Set([...current, peerId])));
          const existing = typingTimers.current.get(peerId);
          if (existing) window.clearTimeout(existing);
          typingTimers.current.set(peerId, window.setTimeout(() => {
            setTypingPeers((current) => current.filter((item) => item !== peerId));
            typingTimers.current.delete(peerId);
          }, 3000));
          return;
        }
        if (payload.receiptIds) {
          useVortexStore.getState().markAllViewed(roomId);
          return;
        }
        if (payload.profile) {
          useVortexStore.getState().setPeerProfile(payload.profile.did, payload.profile);
          return;
        }
        if (payload.kind === 'reaction') {
          try { const data = JSON.parse(payload.body) as { messageId?: string; emoji?: string }; if (data.messageId && data.emoji) useVortexStore.getState().toggleReaction(roomId, data.messageId, data.emoji, payload.senderDid); } catch { /* ignore */ }
          return;
        }
        await useVortexStore.getState().receiveWireMessage(roomId, payload);
        if (!room?.muted && payload.senderDid !== myDid && document.hidden) {
          void playMessageChime();
          void showIncomingMessageNotification(peerName, payload.body.slice(0, 80));
        }
      } catch (error) {
        console.error('Failed to handle an incoming message', error);
      }
    });
    return () => { offPeer(); offMessage(); };
  }, [roomId, myDid, peerName, room?.muted, setPeers]);

  useEffect(() => { useVortexStore.getState().markRoomOpened(roomId); }, [roomId]);

  const handleSendText = useCallback((text: string, replyToId: string | null = null) => {
    void sendChatMessage(roomId, text, { replyToId }).catch((error) => console.error('Send failed:', error));
  }, [roomId]);

  const handleSendSticker = useCallback((stickerId: string) => {
    void sendChatMessage(roomId, 'sticker:' + stickerId, { kind: 'sticker' }).catch((error) => console.error('Send sticker failed:', error));
  }, [roomId]);

  const handleSendVoice = useCallback((dataUri: string, durationMs: number) => {
    const media = { name: 'voice-message.opus', mime: 'audio/ogg', size: Math.floor(dataUri.length * 0.75), dataUri, durationMs };
    void sendChatMessage(roomId, '', { kind: 'voice', media }).catch((error) => console.error('Send voice failed:', error));
  }, [roomId]);

  const handleSendFile = useCallback((name: string, mime: string, dataUri: string, size: number) => {
    const media = { name, mime, size, dataUri };
    void sendChatMessage(roomId, name, { kind: 'file', media }).catch((error) => console.error('Send file failed:', error));
  }, [roomId]);

  const handleEditSave = useCallback((messageId: string, body: string) => {
    setEditing(null);
    void editSentMessage(roomId, messageId, body).catch((error) => console.error('Edit failed:', error));
  }, [roomId]);

  const handleTyping = useCallback((): void => { void sendTypingIndicator(roomId); }, [roomId]);

  const handleReaction = useCallback((messageId: string, emoji: string) => {
    toggleReaction(roomId, messageId, emoji, myDid);
    void sendReaction(roomId, messageId, emoji).catch((error) => console.error('Reaction failed:', error));
  }, [roomId, myDid, toggleReaction]);

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
          onLeave={() => { deleteRoom(roomId); void webrtcManager.leave(roomId); router.push('/'); }}
          onOpenProfile={() => setProfilePanelOpen(true)}
        />
        {pinnedMessage ? (
          <div className="flex items-center gap-2 border-b border-gotoap-line bg-gotoap-panel/90 px-4 py-1.5 text-[13px]">
            <PinIcon size={14} className="shrink-0 text-gotoap-accent" />
            <span className="truncate text-gotoap-ink-muted">{pinnedMessage.body.slice(0, 120)}</span>
            <button type="button" onClick={() => setPinnedId(null)} className="ml-auto text-xs text-gotoap-accent hover:underline">Unpin</button>
          </div>
        ) : null}
        <ChatHistory roomId={roomId} myDid={myDid} onAction={handleMessageAction} onReaction={handleReaction} />
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
      {profilePanelOpen ? <ChatProfilePanel roomId={roomId} onClose={() => setProfilePanelOpen(false)} /> : null}
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
