/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

// Workbox precaching — maintains existing offline support
precacheAndRoute(self.__WB_MANIFEST);

// Push event handler — MUST call showNotification() immediately
// (iOS revokes permission after ~3 failed attempts)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Storyworthy';
  const body = data.body || 'Time to write your journal entry!';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/storyworthy/icons/icon.svg',
      badge: '/storyworthy/icons/icon.svg',
      tag: 'storyworthy-push',
      data: { url: '/storyworthy/' },
    })
  );
});

// Notification click handler — opens/focuses the app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/storyworthy/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if found
      for (const client of clients) {
        if (client.url.includes('/storyworthy/') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(url);
    })
  );
});

// Re-subscribe on subscription expiry (iOS resilience)
self.addEventListener('pushsubscriptionchange', (event) => {
  const pushEvent = event as ExtendableEvent & {
    oldSubscription?: PushSubscription;
    newSubscription?: PushSubscription;
  };

  pushEvent.waitUntil(
    (async () => {
      try {
        const subscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: pushEvent.oldSubscription?.options.applicationServerKey,
        });

        // Send new subscription to worker
        const workerUrl = import.meta.env.VITE_PUSH_WORKER_URL;
        if (workerUrl) {
          await fetch(`${workerUrl}/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription.toJSON()),
          });
        }
      } catch {
        // Silently fail — will retry on next app open
      }
    })()
  );
});
