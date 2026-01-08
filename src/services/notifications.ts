import { getEntry } from './db';
import { getTodayDateString } from '../utils/date';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function showNotification(title: string, body: string): Promise<void> {
  if (Notification.permission !== 'granted') return;

  const registration = await navigator.serviceWorker?.ready;
  if (registration) {
    await registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'daily-moments',
    });
  } else {
    new Notification(title, { body, icon: '/icons/icon-192.png' });
  }
}

// Schedule check for notifications
let morningTimeout: ReturnType<typeof setTimeout> | null = null;
let eveningTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleNotifications(
  morningTime: string = '09:00',
  eveningTime: string = '21:00',
  morningEnabled: boolean = true,
  eveningEnabled: boolean = true
): void {
  clearScheduledNotifications();

  if (morningEnabled) {
    morningTimeout = scheduleNotificationAt(
      morningTime,
      'Daily Moments',
      'Take a moment to reflect on today'
    );
  }

  if (eveningEnabled) {
    eveningTimeout = scheduleNotificationAt(
      eveningTime,
      'Daily Moments',
      'How was your day?'
    );
  }
}

function scheduleNotificationAt(
  time: string,
  title: string,
  body: string
): ReturnType<typeof setTimeout> {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const delay = scheduledTime.getTime() - now.getTime();

  return setTimeout(async () => {
    // Check if today's entry exists
    const todayEntry = await getEntry(getTodayDateString());
    const hasEntry = todayEntry && (todayEntry.storyworthy || todayEntry.thankful);

    if (!hasEntry) {
      await showNotification(title, body);
    }

    // Reschedule for next day
    scheduleNotificationAt(time, title, body);
  }, delay);
}

export function clearScheduledNotifications(): void {
  if (morningTimeout) {
    clearTimeout(morningTimeout);
    morningTimeout = null;
  }
  if (eveningTimeout) {
    clearTimeout(eveningTimeout);
    eveningTimeout = null;
  }
}

// Badge management
export async function updateBadge(count: number): Promise<void> {
  if ('setAppBadge' in navigator) {
    try {
      if (count > 0) {
        await (navigator as Navigator & { setAppBadge: (count: number) => Promise<void> }).setAppBadge(Math.min(count, 9));
      } else {
        await (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge();
      }
    } catch (error) {
      console.error('Badge update failed:', error);
    }
  }
}

export async function getIncompleteDaysCount(): Promise<number> {
  // For now, just check if today is incomplete
  const todayEntry = await getEntry(getTodayDateString());
  return todayEntry && (todayEntry.storyworthy || todayEntry.thankful) ? 0 : 1;
}
