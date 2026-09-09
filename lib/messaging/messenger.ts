/** Central messaging layer: builds, signs, encrypts, sends, and persists all message kinds. */
import type { ChatWireMessage, MessageKind, PeerProfilePayload } from '@/lib/p2p/trysteroSetup';
import { getStoredDIDKeyPair } from '@/lib/did/keyGenerator';
import { deriveRoomKey, encryptText, signMessageText } from '@/lib/crypto/encryption';
import { webrtcManager } from '@/lib/p2p/webrtcManager';
import { loadLocalHistory, mergeHistory, patchLocalHistory, saveLocalHistory } from '@/lib/p2p/torrentHistory';
import { parsePlainPayload, useVortexStore, type MessageMedia } from '@/lib/store/useVortexStore';

export interface SendOptions {
  kind?: MessageKind;
  replyToId?: string | null;
  media?: MessageMedia | null;
  forwarded?: boolean;
}

function requireDid(): { did: string; secretKey: Uint8Array } {
  const me = getStoredDIDKeyPair();
  if (!me) throw new Error('The DID wallet has not been created yet');
  return { did: me.did, secretKey: me.secretKey };
}

/** Builds a signed, encrypted wire message ready to send. */
async function buildWire(roomId: string, plainBody: string, options: SendOptions): Promise<ChatWireMessage> {
  const me = requireDid();
  const key = await deriveRoomKey(roomId);
  const payload = JSON.stringify({ body: plainBody, media: options.media ?? null });
  const encrypted = await encryptText(payload, key);
  const wireBody = JSON.stringify(encrypted);
  return {
    id: crypto.randomUUID(),
    senderDid: me.did,
    body: wireBody,
    timestamp: Date.now(),
    signature: signMessageText(wireBody, me.secretKey),
    encrypted: true,
    kind: options.kind ?? 'text',
    replyToId: options.replyToId ?? undefined,
  };
}

/** Sends a chat message and stores it locally as an own message. */
export async function sendChatMessage(roomId: string, plainBody: string, options: SendOptions = {}): Promise<ChatWireMessage> {
  try {
    const wire = await buildWire(roomId, plainBody, options);
    await webrtcManager.send(roomId, wire);
    const store = useVortexStore.getState();
    const parsed = parsePlainPayload(JSON.stringify({ body: plainBody, media: options.media ?? null }));
    const message = {
      ...wire,
      roomId,
      mine: true,
      kind: wire.kind ?? 'text',
      media: parsed.media,
      editedAt: null,
      deletedAt: null,
      replyToId: wire.replyToId ?? null,
      viewed: false,
      forwarded: Boolean(options.forwarded),
    } as Parameters<typeof store.addMessage>[1];
    store.addMessage(roomId, { ...message, signature: wire.signature });
    saveLocalHistory(roomId, mergeHistory(loadLocalHistory(roomId), wire));
    return wire;
  } catch (error) {
    console.error('Failed to send the chat message:', error);
    throw error instanceof Error ? error : new Error('Failed to send the chat message');
  }
}

/** Edits a previously sent message and propagates the change to peers. */
export async function editSentMessage(roomId: string, messageId: string, newBody: string): Promise<void> {
  try {
    const wire = await buildWire(roomId, newBody, { kind: 'text' });
    const editWire: ChatWireMessage = { ...wire, editOf: messageId, editedAt: wire.timestamp };
    await webrtcManager.send(roomId, editWire);
    useVortexStore.getState().editMessage(roomId, messageId, newBody, wire.timestamp);
    patchLocalHistory(roomId, messageId, { body: wire.body, signature: wire.signature, editedAt: wire.timestamp, id: messageId });
  } catch (error) {
    console.error('Failed to edit the message:', error);
    throw error instanceof Error ? error : new Error('Failed to edit the message');
  }
}

/** Deletes a previously sent message (tombstone) and propagates the change to peers. */
export async function deleteSentMessage(roomId: string, messageId: string): Promise<void> {
  try {
    const me = requireDid();
    const tombstone: ChatWireMessage = { id: crypto.randomUUID(), senderDid: me.did, body: '', timestamp: Date.now(), signature: '', encrypted: false, editOf: messageId, deleted: true };
    await webrtcManager.send(roomId, tombstone);
    useVortexStore.getState().deleteMessage(roomId, messageId, tombstone.timestamp);
    patchLocalHistory(roomId, messageId, { deleted: true, body: '' });
  } catch (error) {
    console.error('Failed to delete the message:', error);
    throw error instanceof Error ? error : new Error('Failed to delete the message');
  }
}

/** Forwards an existing message into another room as a fresh message. */
export async function forwardMessage(roomId: string, body: string, kind: MessageKind, media: MessageMedia | null): Promise<void> {
  try {
    await sendChatMessage(roomId, body, { kind, media, forwarded: true });
  } catch (error) {
    console.error('Failed to forward the message:', error);
    throw error instanceof Error ? error : new Error('Failed to forward the message');
  }
}

/** Sends an ephemeral typing indicator (not persisted). */
export async function sendTypingIndicator(roomId: string): Promise<void> {
  try {
    const me = requireDid();
    const wire: ChatWireMessage = { id: crypto.randomUUID(), senderDid: me.did, body: '', timestamp: Date.now(), signature: '', encrypted: false, typing: true };
    await webrtcManager.send(roomId, wire);
  } catch (error) {
    console.error('Failed to send the typing indicator:', error);
  }
}

/** Sends read receipts for the given message ids (not persisted). */
export async function sendReadReceipts(roomId: string, ids: string[]): Promise<void> {
  try {
    if (ids.length === 0) return;
    const me = requireDid();
    const wire: ChatWireMessage = { id: crypto.randomUUID(), senderDid: me.did, body: '', timestamp: Date.now(), signature: '', encrypted: false, receiptIds: ids };
    await webrtcManager.send(roomId, wire);
  } catch (error) {
    console.error('Failed to send the read receipts:', error);
  }
}

/** Sends a reaction toggle for a message (not persisted, ephemeral). */
export async function sendReaction(roomId: string, messageId: string, emoji: string): Promise<void> {
  try {
    const me = requireDid();
    const wire: ChatWireMessage = { id: crypto.randomUUID(), senderDid: me.did, body: JSON.stringify({ messageId, emoji }), timestamp: Date.now(), signature: "", encrypted: false, kind: "reaction" };
    await webrtcManager.send(roomId, wire);
  } catch (error) {
    console.error("Failed to send the reaction:", error);
  }
}

/** Broadcasts the local profile to everyone in the room. */
export async function broadcastProfile(roomId: string, profile: PeerProfilePayload): Promise<void> {
  try {
    const me = requireDid();
    const wire: ChatWireMessage = { id: crypto.randomUUID(), senderDid: me.did, body: JSON.stringify(profile), timestamp: Date.now(), signature: '', encrypted: false, profile };
    await webrtcManager.send(roomId, wire);
  } catch (error) {
    console.error('Failed to broadcast the profile:', error);
  }
}

/** Sends call signaling (SDP offer/answer, ICE candidates, hangup) over the P2P channel. */
export async function sendCallSignal(roomId: string, call: ChatWireMessage['call']): Promise<void> {
  try {
    const me = requireDid();
    const wire: ChatWireMessage = { id: crypto.randomUUID(), senderDid: me.did, body: '', timestamp: Date.now(), signature: '', encrypted: false, call };
    await webrtcManager.send(roomId, wire);
  } catch (error) {
    console.error('Failed to send the call signal:', error);
    throw error instanceof Error ? error : new Error('Failed to send the call signal');
  }
}

/** Exports every local room, message, and the profile as a downloadable JSON file. */
export function exportAllData(): void {
  try {
    if (typeof window === 'undefined') throw new Error('Export is only available in the browser');
    const state = useVortexStore.getState();
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: state.profile,
      did: state.currentDid?.did ?? null,
      rooms: state.activeRooms,
      messages: state.messages,
      history: Object.fromEntries(state.activeRooms.map((room) => [room.id, loadLocalHistory(room.id)])),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gotoap-export-' + new Date().toISOString().slice(0, 10) + '.json';
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export the data:', error);
    throw error instanceof Error ? error : new Error('Failed to export the data');
  }
}
