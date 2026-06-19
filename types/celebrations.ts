export type CelebrationType =
  | "water_goal"
  | "habits_complete"
  | "focus_complete"
  | "streak_3"
  | "streak_7"
  | "streak_14"
  | "streak_30"
  | "day_score_80"
  | "weight_half_kg"
  | "weight_1kg"
  | "weight_5kg"
  | "first_habit"
  | "first_food"
  | "first_focus"
  | "calorie_goal";

export interface CelebrationExtraData {
  streakCount?: number;
  weightLost?: number;
  score?: number;
  customMessage?: string;
}

export interface CelebrationConfig {
  animation: number;
  title: string;
  subtitle: string;
  accentColor: string;
  autoCloseDuration: number;
  showConfetti: boolean;
  showShareButton: boolean;
  size: "small" | "large";
  dismissLabel: string;
}
