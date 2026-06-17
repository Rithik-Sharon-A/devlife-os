import { format, subDays } from "date-fns";

import type { HabitLog } from "../types";
import { getLast7Days } from "./date";

export function isHabitDoneOnDate(
  habitId: string,
  date: string,
  logs: HabitLog[]
): boolean {
  return logs.some(
    (log) => log.habitId === habitId && log.date === date && log.isCompleted
  );
}

export function getLast7DayCompletion(
  habitId: string,
  logs: HabitLog[]
): boolean[] {
  return getLast7Days().map((date) => isHabitDoneOnDate(habitId, date, logs));
}

export function getCurrentStreak(habitId: string, logs: HabitLog[]): number {
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    const done = isHabitDoneOnDate(habitId, date, logs);

    if (i === 0 && !done) continue;
    if (done) streak += 1;
    else break;
  }

  return streak;
}

export function encouragementForProgress(completed: number, total: number): string {
  if (total === 0) return "Add habits to start building routines.";
  const percent = (completed / total) * 100;

  if (percent >= 100) return "Perfect day — all habits done!";
  if (percent >= 75) return "Almost there — finish strong!";
  if (percent >= 50) return "Halfway there, keep the momentum!";
  if (percent > 0) return "Good start — one habit at a time.";
  return "Start with one small win today.";
}
