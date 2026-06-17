import {
  differenceInDays,
  format,
  isSameDay,
  parseISO,
  subDays,
} from "date-fns";

import type { TimeOfDay } from "../types";

/** Returns today's date as `YYYY-MM-DD`. */
export function getTodayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Returns the current time as an ISO 8601 timestamp. */
export function getNowString(): string {
  return new Date().toISOString();
}

/** Maps the current hour to a time-of-day bucket. */
export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/** Returns a time-of-day greeting with the user's name. */
export function getGreeting(name: string): string {
  const labels: Record<TimeOfDay, string> = {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    night: "Good night",
  };

  return `${labels[getTimeOfDay()]}, ${name} 👋`;
}

/** Formats an ISO timestamp as `8:30 AM`. */
export function formatTime(isoString: string): string {
  try {
    return format(parseISO(isoString), "h:mm a");
  } catch {
    return isoString;
  }
}

/** Formats seconds as `HH:MM:SS` for timer displays. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Formats minutes as `1h 25m` or `45m`. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/** Returns the weekday name for a `YYYY-MM-DD` date string. */
export function getDayOfWeek(dateString: string): string {
  try {
    return format(parseISO(dateString), "EEEE");
  } catch {
    return "";
  }
}

/** Returns the last 7 calendar days as `YYYY-MM-DD` strings (oldest first). */
export function getLast7Days(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) =>
    format(subDays(today, 6 - i), "yyyy-MM-dd")
  );
}

/** Returns true when `dateString` is today's date. */
export function isToday(dateString: string): boolean {
  try {
    return isSameDay(parseISO(dateString), new Date());
  } catch {
    return false;
  }
}

/** Returns the absolute number of days between two `YYYY-MM-DD` strings. */
export function daysBetween(date1: string, date2: string): number {
  try {
    return Math.abs(differenceInDays(parseISO(date1), parseISO(date2)));
  } catch {
    return 0;
  }
}

/** Extracts `YYYY-MM-DD` from an ISO timestamp. Falls back to today on parse error. */
export function dateFromTimestamp(isoString: string): string {
  try {
    return format(parseISO(isoString), "yyyy-MM-dd");
  } catch {
    return getTodayString();
  }
}

/** Returns `YYYY-MM-DD` strings for the last N days including today (oldest first). */
export function getLastNDays(n: number): string[] {
  const today = new Date();
  return Array.from({ length: n }, (_, i) =>
    format(subDays(today, n - 1 - i), "yyyy-MM-dd")
  );
}
