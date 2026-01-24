import { getEntry } from './db';
import { getTodayDateString } from '../utils/date';
import type { Reminder, NotificationSettings } from '../types/entry';

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
const scheduledTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

export function scheduleNotifications(reminders: Reminder[]): void {
  clearScheduledNotifications();

  reminders
    .filter((r) => r.enabled)
    .forEach((reminder) => {
      const timeout = scheduleNotificationAt(
        reminder.id,
        reminder.time,
        'Storyworthy',
        reminder.label ? `Time for your ${reminder.label.toLowerCase()} reflection` : 'How was your day?'
      );
      scheduledTimeouts.set(reminder.id, timeout);
    });
}

function scheduleNotificationAt(
  id: string,
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
    const newTimeout = scheduleNotificationAt(id, time, title, body);
    scheduledTimeouts.set(id, newTimeout);
  }, delay);
}

export function clearScheduledNotifications(): void {
  scheduledTimeouts.forEach((timeout) => clearTimeout(timeout));
  scheduledTimeouts.clear();
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

export async function getIncompleteDaysCount(settings?: NotificationSettings): Promise<number> {
  const todayEntry = await getEntry(getTodayDateString());
  const hasEntry = todayEntry && (todayEntry.storyworthy || todayEntry.thankful);

  if (hasEntry) {
    return 0;
  }

  // If no notification settings provided, don't show badge
  if (!settings || !settings.reminders || settings.reminders.length === 0) {
    return 0;
  }

  // Only show badge if current time is past the first enabled notification time
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Get the earliest enabled notification time
  let earliestNotificationMinutes: number | null = null;

  settings.reminders
    .filter((r) => r.enabled)
    .forEach((reminder) => {
      const [hours, minutes] = reminder.time.split(':').map(Number);
      const reminderMinutes = hours * 60 + minutes;
      if (earliestNotificationMinutes === null || reminderMinutes < earliestNotificationMinutes) {
        earliestNotificationMinutes = reminderMinutes;
      }
    });

  // If no notifications enabled, don't show badge
  if (earliestNotificationMinutes === null) {
    return 0;
  }

  // Show badge only if current time is past the notification time
  return currentMinutes >= earliestNotificationMinutes ? 1 : 0;
}
