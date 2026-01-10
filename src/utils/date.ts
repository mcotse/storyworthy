import {
  format,
  isToday,
  isYesterday,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
  isFuture,
  differenceInDays,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDateString(dateString: string): string {
  const date = parseISO(dateString);

  if (isToday(date)) {
    return 'Today';
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  return format(date, 'EEE, MMM d, yyyy');
}

export function formatDateShort(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'MMM d');
}

export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'just now';
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    }
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
}

export function getMonthDays(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  return eachDayOfInterval({ start, end });
}

export function getCalendarDays(year: number, month: number): { date: Date; isCurrentMonth: boolean }[] {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return days.map((date) => ({
    date,
    isCurrentMonth: isSameMonth(date, monthStart),
  }));
}

export function formatMonthYear(year: number, month: number): string {
  return format(new Date(year, month), 'MMMM yyyy');
}

export function getNextMonth(year: number, month: number): { year: number; month: number } {
  const next = addMonths(new Date(year, month), 1);
  return { year: next.getFullYear(), month: next.getMonth() };
}

export function getPrevMonth(year: number, month: number): { year: number; month: number } {
  const prev = subMonths(new Date(year, month), 1);
  return { year: prev.getFullYear(), month: prev.getMonth() };
}

export function dateToString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function isFutureDate(dateString: string): boolean {
  return isFuture(parseISO(dateString));
}

export function isTodayDate(dateString: string): boolean {
  return isToday(parseISO(dateString));
}

export function getAllDatesBetween(startDateString: string, endDateString: string): string[] {
  const start = parseISO(startDateString);
  const end = parseISO(endDateString);
  const days = eachDayOfInterval({ start, end });
  return days.map((d) => format(d, 'yyyy-MM-dd'));
}

export function getDayOfWeek(date: Date): number {
  return getDay(date);
}

export function getTimeOfDay(timestamp: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  const date = new Date(timestamp);
  const hour = date.getHours();

  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function calculateStreak(dates: string[]): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const sortedDates = [...dates].sort((a, b) => b.localeCompare(a));
  const today = getTodayDateString();

  let current = 0;
  let longest = 0;
  let streak = 0;
  let prevDate: string | null = null;
  let isCurrentStreak = true;

  for (const dateStr of sortedDates) {
    if (prevDate === null) {
      // First date
      const daysDiff = differenceInDays(parseISO(today), parseISO(dateStr));

      // Allow 1-day grace period for current streak
      if (daysDiff <= 1) {
        streak = 1;
        isCurrentStreak = true;
      } else {
        isCurrentStreak = false;
        streak = 1;
      }
    } else {
      const daysDiff = differenceInDays(parseISO(prevDate), parseISO(dateStr));

      if (daysDiff === 1) {
        streak++;
      } else if (daysDiff === 2 && isCurrentStreak) {
        // 1-day grace for current streak only
        streak++;
      } else {
        longest = Math.max(longest, streak);
        if (isCurrentStreak) {
          current = streak;
          isCurrentStreak = false;
        }
        streak = 1;
      }
    }

    prevDate = dateStr;
  }

  longest = Math.max(longest, streak);
  if (isCurrentStreak) {
    current = streak;
  }

  return { current, longest };
}
