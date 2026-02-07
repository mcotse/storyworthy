import { logger } from './logger';

const log = logger.child({ service: 'push' });

const WORKER_URL = import.meta.env.VITE_PUSH_WORKER_URL;
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    !!WORKER_URL &&
    !!VAPID_PUBLIC_KEY
  );
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    log.error('get_subscription_failed', error);
    return null;
  }
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    log.info('push_not_supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });

    log.info('push_subscribed', { endpoint: subscription.endpoint });

    // Send subscription to worker
    const response = await fetch(`${WORKER_URL}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!response.ok) {
      log.error('push_subscribe_worker_failed', new Error(`HTTP ${response.status}`));
    }

    return subscription;
  } catch (error) {
    log.error('push_subscribe_failed', error);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const subscription = await getPushSubscription();
    if (!subscription) return true;

    const result = await subscription.unsubscribe();
    log.info('push_unsubscribed', { success: result });
    return result;
  } catch (error) {
    log.error('push_unsubscribe_failed', error);
    return false;
  }
}

export async function sendTestPush(): Promise<boolean> {
  try {
    const subscription = await getPushSubscription();
    if (!subscription) {
      log.warn('push_test_no_subscription');
      return false;
    }

    const response = await fetch(`${WORKER_URL}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    if (!response.ok) {
      log.error('push_test_failed', new Error(`HTTP ${response.status}`));
      return false;
    }

    log.info('push_test_sent');
    return true;
  } catch (error) {
    log.error('push_test_failed', error);
    return false;
  }
}
