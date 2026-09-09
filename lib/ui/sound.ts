/** Tiny notification sound synthesized with WebAudio (no audio assets needed). */
export function playMessageSound(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const gain = context.createGain();
    gain.connect(context.destination);
    const now = context.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    const oscillator = context.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(660, now + 0.12);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + 0.4);
    oscillator.onended = () => { void context.close().catch(() => undefined); };
  } catch (error) {
    console.error('Failed to play the notification sound:', error);
  }
}
