'use client';

/** Registers the Gotoap service worker for offline support and installability.
 * In development we actively kill any stale worker so the browser always loads
 * fresh code. In production we register the SW once and let it manage caching.
 */
import { useEffect } from 'react';

export function ServiceWorkerRegistrar(): null {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      // Development: unregister every stale worker so dev always gets fresh code.
      void (async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
          // Also clear the old cache so the next navigation fetches fresh.
          await window.caches?.delete('gotoap-shell-v1');
        } catch (error) {
          console.error('Failed to clean up development service worker:', error);
        }
      })();
      return; // Don't register a new SW in development
    }

    // Production: register once.
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Failed to register the service worker:', error);
    });
  }, []);
  return null;
}
