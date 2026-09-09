'use client';

/** Registers the Gotoap service worker for offline support and installability. */
import { useEffect } from 'react';

export function ServiceWorkerRegistrar(): null {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const register = (): void => {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Failed to register the service worker:', error);
      });
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);
  return null;
}
