/** Peer-to-peer audio/video calls over WebRTC with trystero data-channel signaling. */
import type { CallSignal, JsonIceCandidate } from '@/lib/p2p/trysteroSetup';
import { getStoredDIDKeyPair } from '@/lib/did/keyGenerator';
import { webrtcManager } from '@/lib/p2p/webrtcManager';
import { startRingtone, stopRingtone } from '@/lib/notifications';

export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'active';

export interface CallState {
  status: CallStatus;
  roomId: string | null;
  peerDid: string | null;
  video: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startedAt: number | null;
  error: string | null;
}

const RING_TIMEOUT_MS = 45000;

function emptyState(): CallState {
  return { status: 'idle', roomId: null, peerDid: null, video: false, localStream: null, remoteStream: null, startedAt: null, error: null };
}

async function sendCallSignal(roomId: string, signal: CallSignal): Promise<void> {
  const me = getStoredDIDKeyPair();
  if (!me) throw new Error('The DID wallet has not been created yet');
  await webrtcManager.send(roomId, { id: crypto.randomUUID(), senderDid: me.did, body: '', timestamp: Date.now(), signature: '', encrypted: false, call: signal });
}

class CallManager {
  private state: CallState = emptyState();
  private handlers = new Set<(state: CallState) => void>();
  private pc: RTCPeerConnection | null = null;
  private pendingCandidates: JsonIceCandidate[] = [];
  private ringTimeout: number | null = null;
  private screenStream: MediaStream | null = null;

  subscribe(handler: (state: CallState) => void): () => void {
    this.handlers.add(handler);
    handler(this.state);
    return () => { this.handlers.delete(handler); };
  }

  getState(): CallState {
    return this.state;
  }

  private emit(patch: Partial<CallState> = {}): void {
    this.state = { ...this.state, ...patch };
    for (const handler of this.handlers) {
      try { handler(this.state); } catch (error) { console.error('Call state handler error:', error); }
    }
  }

  private createPeerConnection(roomId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'] }] });
    pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const candidate: JsonIceCandidate = {
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex,
        usernameFragment: event.candidate.usernameFragment,
      };
      void sendCallSignal(roomId, { type: 'ice', candidate }).catch((error) => console.error('Failed to send the ICE candidate:', error));
    };
    pc.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      this.emit({ remoteStream: stream });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        this.emit({ error: 'The connection failed' });
        this.teardown();
      }
    };
    return pc;
  }

  private async getMedia(video: boolean): Promise<MediaStream> {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true, video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false });
    } catch (error) {
      console.error('Media access failed:', error);
      throw new Error(video ? 'The camera or microphone is unavailable' : 'The microphone is unavailable');
    }
  }

  private armRingTimeout(): void {
    this.clearRingTimeout();
    this.ringTimeout = window.setTimeout(() => {
      if (this.state.status === 'outgoing' || this.state.status === 'incoming') {
        void this.hangup();
      }
    }, RING_TIMEOUT_MS);
  }

  private clearRingTimeout(): void {
    if (this.ringTimeout !== null) {
      window.clearTimeout(this.ringTimeout);
      this.ringTimeout = null;
    }
    stopRingtone();
  }

  /** Starts an outgoing call in the given room. */
  async start(roomId: string, video: boolean): Promise<void> {
    try {
      if (this.state.status !== 'idle') throw new Error('A call is already in progress');
      this.emit({ ...emptyState(), status: 'outgoing', roomId, video });
      const local = await this.getMedia(video);
      this.pc = this.createPeerConnection(roomId);
      for (const track of local.getTracks()) this.pc.addTrack(track, local);
      this.emit({ localStream: local });
      const offer = await this.pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: video });
      await this.pc.setLocalDescription(offer);
      await sendCallSignal(roomId, { type: 'offer', sdp: offer.sdp ?? '', video });
      startRingtone();
      this.armRingTimeout();
    } catch (error) {
      console.error('Failed to start the call:', error);
      this.emit({ error: error instanceof Error ? error.message : 'Failed to start the call' });
      this.teardown();
    }
  }

  /** Accepts an incoming call. */
  async accept(): Promise<void> {
    const { roomId, peerDid, video } = this.state;
    if (this.state.status !== 'incoming' || !roomId || !peerDid || !this.pc) return;
    try {
      this.clearRingTimeout();
      const local = await this.getMedia(video);
      for (const track of local.getTracks()) this.pc.addTrack(track, local);
      this.emit({ status: 'active', localStream: local, startedAt: Date.now() });
      const description = await this.pc.createAnswer();
      await this.pc.setLocalDescription(description);
      await sendCallSignal(roomId, { type: 'answer', sdp: description.sdp ?? '' });
      for (const candidate of this.pendingCandidates) {
        await this.applyCandidate(candidate);
      }
      this.pendingCandidates = [];
    } catch (error) {
      console.error('Failed to accept the call:', error);
      this.emit({ error: error instanceof Error ? error.message : 'Failed to accept the call' });
      void this.hangup();
    }
  }

  /** Rejects an incoming call and notifies the caller. */
  async reject(): Promise<void> {
    const { roomId } = this.state;
    this.clearRingTimeout();
    if (roomId) await sendCallSignal(roomId, { type: 'hangup' }).catch(() => undefined);
    this.teardown();
  }

  /** Ends the current call and notifies the peer. */
  async hangup(): Promise<void> {
    const { roomId } = this.state;
    this.clearRingTimeout();
    if (roomId && this.state.status !== 'incoming') {
      await sendCallSignal(roomId, { type: 'hangup' }).catch((error) => console.error('Failed to send the hangup signal:', error));
    }
    this.teardown();
  }

  private teardown(): void {
    this.clearRingTimeout();
    try { this.pc?.close(); } catch { /* ignored */ }
    this.pc = null;
    for (const track of this.state.localStream?.getTracks() ?? []) track.stop();
    for (const track of this.screenStream?.getTracks() ?? []) track.stop();
    this.screenStream = null;
    this.pendingCandidates = [];
    this.emit(emptyState());
  }

  private async applyCandidate(candidate: JsonIceCandidate): Promise<void> {
    if (!this.pc) return;
    try {
      await this.pc.addIceCandidate(candidate);
    } catch (error) {
      console.error('Failed to apply the ICE candidate:', error);
    }
  }

  /** Handles a call signaling payload received from a peer. */
  async handleSignal(roomId: string, senderDid: string, signal: CallSignal): Promise<void> {
    try {
      if (signal.type === 'offer') {
        if (this.state.status !== 'idle') {
          await sendCallSignal(roomId, { type: 'hangup' });
          return;
        }
        this.emit({ ...emptyState(), status: 'incoming', roomId, peerDid: senderDid, video: signal.video });
        this.pc = this.createPeerConnection(roomId);
        await this.pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
        startRingtone();
        this.armRingTimeout();
        return;
      }
      if (signal.type === 'answer' && this.pc && this.state.status === 'outgoing') {
        await this.pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
        this.clearRingTimeout();
        this.emit({ status: 'active', startedAt: Date.now() });
        return;
      }
      if (signal.type === 'ice' && this.pc) {
        if (this.pc.remoteDescription) await this.applyCandidate(signal.candidate);
        else this.pendingCandidates.push(signal.candidate);
        return;
      }
      if (signal.type === 'hangup') {
        this.teardown();
      }
    } catch (error) {
      console.error('Failed to handle the call signal:', error);
    }
  }

  /** Toggles the microphone mute state; returns the new muted value. */
  toggleMic(): boolean {
    const tracks = this.state.localStream?.getAudioTracks() ?? [];
    const next = tracks.some((track) => track.enabled);
    for (const track of tracks) track.enabled = !next;
    return !next;
  }

  /** Toggles the local camera; returns the new camera-off value. */
  toggleCamera(): boolean {
    const tracks = this.state.localStream?.getVideoTracks() ?? [];
    const next = tracks.some((track) => track.enabled);
    for (const track of tracks) track.enabled = !next;
    return !next;
  }

  /** Replaces the outgoing video with a screen share (or restores the camera). */
  async toggleScreenShare(): Promise<boolean> {
    try {
      const roomId = this.state.roomId;
      if (!this.pc || !roomId) return false;
      const sender = this.pc.getSenders().find((item) => item.track?.kind === 'video');
      if (this.screenStream) {
        const cameraTrack = this.state.localStream?.getVideoTracks()[0] ?? null;
        if (sender && cameraTrack) await sender.replaceTrack(cameraTrack);
        for (const track of this.screenStream.getTracks()) track.stop();
        this.screenStream = null;
        return false;
      }
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = display.getVideoTracks()[0];
      if (!track) return false;
      track.onended = () => { void this.toggleScreenShare(); };
      if (sender) await sender.replaceTrack(track);
      this.screenStream = display;
      return true;
    } catch (error) {
      console.error('Screen sharing failed:', error);
      return false;
    }
  }
}

export const callManager = new CallManager();
