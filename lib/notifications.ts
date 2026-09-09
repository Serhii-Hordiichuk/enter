/** System notifications and a soft in-app notification sound (no audio assets). */

let audioContext: AudioContext | null = null;

/** Requests the browser notification permission. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    if (Notification.permission === 'default') return await Notification.requestPermission();
    return Notification.permission;
  } catch (error) {
    console.error('Failed to request the notification permission:', error);
    return 'denied';
  }
}

/** Shows a system notification when the tab is hidden and permission is granted. */
export function showIncomingMessageNotification(title: string, body: string, onClick?: () => void): void {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted' || !document.hidden) return;
    const notification = new Notification(title, { body, silent: true });
    notification.onclick = () => {
      window.focus();
      onClick?.();
      notification.close();
    };
  } catch (error) {
    console.error('Failed to show the notification:', error);
  }
}

/** Plays a short two-tone chime generated with the WebAudio API. */
export function playMessageChime(): void {
  try {
    type AudioContextConstructor = new () => AudioContext;
    const w = window as unknown as { AudioContext?: AudioContextConstructor; webkitAudioContext?: AudioContextConstructor };
    const Context = w.AudioContext ?? w.webkitAudioContext;
    if (!Context) return;
    audioContext = audioContext ?? new Context();
    const ctx = audioContext;
    const now = ctx.currentTime;
    for (const [offset, frequency] of [[0, 660], [0.12, 880]] as const) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.06, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.2);
    }
  } catch (error) {
    console.error('Failed to play the message chime:', error);
  }
}

let ringtoneTimer: number | null = null;

/** Starts a looping ringtone for incoming or outgoing calls. */
export function startRingtone(): void {
  try {
    if (ringtoneTimer !== null || typeof window === 'undefined') return;
    const ring = (): void => {
      playMessageChime();
      window.setTimeout(playMessageChime, 260);
    };
    ring();
    ringtoneTimer = window.setInterval(ring, 1600);
  } catch (error) {
    console.error('Failed to start the ringtone:', error);
  }
}

/** Stops the looping ringtone. */
export function stopRingtone(): void {
  if (ringtoneTimer !== null) {
    window.clearInterval(ringtoneTimer);
    ringtoneTimer = null;
  }
}

