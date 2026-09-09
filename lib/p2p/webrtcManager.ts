/** WebRTC room manager on top of trystero. */
import type { ChatWireMessage, GotoapRoomHandle } from './trysteroSetup';
import { createRoom } from './trysteroSetup';

export type PeerEvent = { type: 'join'; peerId: string } | { type: 'leave'; peerId: string };
export type RemoteMessageHandler = (message: ChatWireMessage, peerId: string) => void;
export type PeerEventHandler = (event: PeerEvent) => void;

export class WebrtcManager {
  private handles = new Map<string, GotoapRoomHandle>();
  private messageHandlers = new Map<string, Set<RemoteMessageHandler>>();
  private peerHandlers = new Map<string, Set<PeerEventHandler>>();

  async join(roomId: string): Promise<GotoapRoomHandle> {
    try {
      const existing = this.handles.get(roomId);
      if (existing) return existing;
      const handle = await createRoom(roomId);
      handle.messageAction.onMessage = (data, context) => {
        for (const handler of this.messageHandlers.get(roomId) ?? []) {
          try { handler(data, context.peerId); } catch (error) { console.error('P2P message handler error:', error); }
        }
      };
      handle.room.onPeerJoin = (peerId) => this.emitPeer(roomId, { type: 'join', peerId });
      handle.room.onPeerLeave = (peerId) => this.emitPeer(roomId, { type: 'leave', peerId });
      this.handles.set(roomId, handle);
      return handle;
    } catch (error) {
      console.error('Failed to join the room:', error);
      throw error instanceof Error ? error : new Error('Failed to join the room');
    }
  }

  onMessage(roomId: string, handler: RemoteMessageHandler): () => void {
    const handlers = this.messageHandlers.get(roomId) ?? new Set<RemoteMessageHandler>();
    handlers.add(handler);
    this.messageHandlers.set(roomId, handlers);
    return () => { handlers.delete(handler); };
  }

  onPeerEvent(roomId: string, handler: PeerEventHandler): () => void {
    const handlers = this.peerHandlers.get(roomId) ?? new Set<PeerEventHandler>();
    handlers.add(handler);
    this.peerHandlers.set(roomId, handlers);
    return () => { handlers.delete(handler); };
  }

  async send(roomId: string, message: ChatWireMessage): Promise<void> {
    try {
      const handle = this.handles.get(roomId) ?? (await this.join(roomId));
      await handle.messageAction.send(message);
    } catch (error) {
      console.error('Failed to send a P2P message:', error);
      throw error instanceof Error ? error : new Error('Failed to send a P2P message');
    }
  }

  getPeerIds(roomId: string): string[] {
    const handle = this.handles.get(roomId);
    if (!handle) return [];
    try { return Object.keys(handle.room.getPeers()); } catch (error) { console.error('Failed to list peers:', error); return []; }
  }

  async leave(roomId: string): Promise<void> {
    const handle = this.handles.get(roomId);
    this.handles.delete(roomId);
    this.messageHandlers.delete(roomId);
    this.peerHandlers.delete(roomId);
    if (handle) {
      try { await handle.leave(); } catch (error) { console.error('Room leave error:', error); }
    }
  }

  private emitPeer(roomId: string, event: PeerEvent): void {
    for (const handler of this.peerHandlers.get(roomId) ?? []) {
      try { handler(event); } catch (error) { console.error('Peer event handler error:', error); }
    }
  }
}

export const webrtcManager = new WebrtcManager();
