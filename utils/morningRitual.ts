import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, subDays } from "date-fns";

import type {
  DailyContext,
  DailyFoodLog,
  Habit,
  HabitLog,
  MoodRating,
  UserProfile,
  WaterConfig,
} from "../types";
import { getTodayString } from "./date";
import * as storage from "./storage";
import { calculateDayScore } from "./tdee";

export const MORNING_RITUAL_DATE_KEY = "dayos:morning_ritual_date";
export const MORNING_MOOD_KEY = "dayos:morning_mood";
export const MORNING_MISSION_KEY = "dayos:morning_mission";

const emptyFoodLog = (date: string): DailyFoodLog => ({
  date,
  entries: [],
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
});

export function isMorningRitualWindow(): boolean {
  const hour = new Date().getHours();
  return hour >= 5 && hour < 11;
}

export async function getMorningRitualDate(): Promise<string | null> {
  return AsyncStorage.getItem(MORNING_RITUAL_DATE_KEY);
}

export async function isMorningRitualDoneToday(): Promise<boolean> {
  const saved = await getMorningRitualDate();
  return saved === getTodayString();
}

export async function shouldShowMorningRitual(): Promise<boolean> {
  if (!isMorningRitualWindow()) return false;
  return !(await isMorningRitualDoneToday());
}

export async function completeMorningRitual(
  mood: MoodRating,
  mission: string
): Promise<void> {
  await AsyncStorage.multiSet([
    [MORNING_RITUAL_DATE_KEY, getTodayString()],
    [MORNING_MOOD_KEY, String(mood)],
    [MORNING_MISSION_KEY, mission],
  ]);
}

export async function getStoredMorningMission(): Promise<string | null> {
  return AsyncStorage.getItem(MORNING_MISSION_KEY);
}

export interface YesterdaySnapshot {
  date: string;
  hasData: boolean;
  score: number;
  scoreLabel: string;
  summary: string;
  waterPct: number;
  caloriesPct: number;
  habitsPct: number;
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent day";
  if (score >= 60) return "Good progress";
  if (score >= 40) return "Building up";
  return "Rough day";
}

function buildYesterdaySummary(
  score: number,
  waterPct: number,
  caloriesPct: number,
  habitsPct: number,
  food: DailyFoodLog
): string {
  if (score >= 80) {
    return "Strong day overall. Keep that momentum going today.";
  }

  const misses: string[] = [];
  if (waterPct < 50) misses.push("water goal");
  if (caloriesPct < 40 || caloriesPct > 120) misses.push("calorie tracking");
  if (habitsPct < 50) misses.push("habits");
  if (food.entries.length === 0) misses.push("meal logging");

  if (misses.length === 0) {
    return "Room to improve in a few areas. Fresh start today.";
  }

  return `You missed ${misses.slice(0, 2).join(" and ")}. Fresh start today.`;
}

export async function loadYesterdaySnapshot(
  profile: UserProfile,
  habits: Habit[],
  habitLogs: HabitLog[],
  waterConfig: WaterConfig
): Promise<YesterdaySnapshot> {
  const date = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const food = (await storage.getFoodLog(date)) ?? emptyFoodLog(date);
  const allWater = await storage.getAllWaterLogs();
  const waterLog = allWater[date];
  const bottlesConsumed = waterLog?.bottleCount ?? 0;

  const active = habits.filter((h) => h.isActive);
  const completed = active.filter((h) =>
    habitLogs.some((l) => l.habitId === h.id && l.date === date && l.isCompleted)
  ).length;

  const hasData =
    food.entries.length > 0 ||
    bottlesConsumed > 0 ||
    completed > 0;

  const context: DailyContext = {
    profile,
    date,
    timeOfDay: "morning",
    food,
    water: {
      bottlesConsumed,
      goalBottles: waterConfig.dailyGoalBottles,
      mlConsumed: waterLog?.totalMl ?? 0,
    },
    tasks: { total: 0, completed: 0, mitCompleted: false },
    habits: {
      total: active.length,
      completed,
      list: active.map((h) => h.name),
    },
    focus: { sessionsCompleted: 0, totalMinutes: 0 },
    dayScore: {
      tasksPercent: 0,
      caloriesPercent: 0,
      waterPercent: 0,
      habitsPercent: 0,
      overall: 0,
    },
  };

  const dayScore = calculateDayScore(context);

  return {
    date,
    hasData,
    score: Math.round(dayScore.overall),
    scoreLabel: scoreLabel(dayScore.overall),
    summary: hasData
      ? buildYesterdaySummary(
          dayScore.overall,
          dayScore.waterPercent,
          dayScore.caloriesPercent,
          dayScore.habitsPercent,
          food
        )
      : "First day! Let's set a strong baseline.",
    waterPct: dayScore.waterPercent,
    caloriesPct: dayScore.caloriesPercent,
    habitsPct: dayScore.habitsPercent,
  };
}

export function buildRuleBasedMission(
  profile: UserProfile,
  yesterday: YesterdaySnapshot,
  waterConfig: WaterConfig
): string {
  const calorieGoal = profile.dailyCalorieGoal;
  const bottleGoal = waterConfig.dailyGoalBottles;

  if (yesterday.waterPct < 50) {
    return `Today's mission: Drink ${bottleGoal} bottles of water. Yesterday you were under on hydration.`;
  }
  if (yesterday.caloriesPct < 40 || yesterday.caloriesPct > 120) {
    return `Today's mission: Hit ${calorieGoal.toLocaleString()} kcal and log every meal.`;
  }
  if (yesterday.habitsPct < 50) {
    return "Today's mission: Complete all habits today. Small wins stack up.";
  }
  return `Today's mission: Hit ${calorieGoal.toLocaleString()} kcal and drink ${bottleGoal} bottles. Make today count 💪`;
}

export interface GreetingContext {
  name: string;
  streak: number;
  score: number;
  calories: number;
  calorieGoal: number;
  waterLogged: boolean;
}

export function getPersonalizedGreeting(ctx: GreetingContext): {
  headline: string;
  subline?: string;
} {
  const { name, streak, score, calories, calorieGoal, waterLogged } = ctx;
  const hour = new Date().getHours();
  const dayProgress = Math.round(((hour * 60 + new Date().getMinutes()) / (24 * 60)) * 100);

  if (hour < 6) {
    return { headline: `Early bird! 🌙 Good morning, ${name}` };
  }

  if (hour < 9) {
    const subline =
      streak > 3 ? `Day ${streak} of your streak!` : undefined;
    return { headline: `Good morning, ${name} 👋`, subline };
  }

  if (hour < 12) {
    let subline: string | undefined;
    if (calories === 0) subline = "Time for breakfast!";
    else if (waterLogged) subline = "Great start on hydration!";
    return { headline: `Morning, ${name} ☀️`, subline };
  }

  if (hour < 17) {
    return {
      headline: `Hey ${name} 👋`,
      subline: `You're ${dayProgress}% through your day`,
    };
  }

  if (hour < 21) {
    return {
      headline: `Evening, ${name} 🌆`,
      subline: `Score: ${score}% — finish strong`,
    };
  }

  return {
    headline: `Almost done, ${name} 🌙`,
    subline: "Log your evening and rest well",
  };
}

export function getScoreMoodLabel(score: number): string {
  if (score >= 80) return "🏆 Excellent day";
  if (score >= 60) return "💪 Good progress";
  if (score >= 40) return "📈 Building up";
  return "🌱 Fresh start";
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}
