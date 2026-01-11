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
      'Storyworthy',
      'Take a moment to reflect on today'
    );
  }

  if (eveningEnabled) {
    eveningTimeout = scheduleNotificationAt(
      eveningTime,
      'Storyworthy',
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

interface NotificationSettings {
  morningEnabled: boolean;
  morningTime: string;
  eveningEnabled: boolean;
  eveningTime: string;
}

export async function getIncompleteDaysCount(settings?: NotificationSettings): Promise<number> {
  const todayEntry = await getEntry(getTodayDateString());
  const hasEntry = todayEntry && (todayEntry.storyworthy || todayEntry.thankful);

  if (hasEntry) {
    return 0;
  }

  // If no notification settings provided, don't show badge
  if (!settings) {
    return 0;
  }

  // Only show badge if current time is past the first enabled notification time
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Get the earliest enabled notification time
  let earliestNotificationMinutes: number | null = null;

  if (settings.morningEnabled) {
    const [hours, minutes] = settings.morningTime.split(':').map(Number);
    earliestNotificationMinutes = hours * 60 + minutes;
  }

  if (settings.eveningEnabled) {
    const [hours, minutes] = settings.eveningTime.split(':').map(Number);
    const eveningMinutes = hours * 60 + minutes;
    if (earliestNotificationMinutes === null || eveningMinutes < earliestNotificationMinutes) {
      earliestNotificationMinutes = eveningMinutes;
    }
  }

  // If no notifications enabled, don't show badge
  if (earliestNotificationMinutes === null) {
    return 0;
  }

  // Show badge only if current time is past the notification time
  return currentMinutes >= earliestNotificationMinutes ? 1 : 0;
}
