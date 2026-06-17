// ─── User Profile ────────────────────────────────────────────────────────────

export type GoalType = "weight_loss" | "weight_gain" | "maintain";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active";

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  goalType: GoalType;
  activityLevel: ActivityLevel;
  tdee: number;
  dailyCalorieGoal: number;
  isOnboarded: boolean;
  createdAt: string;
}

// ─── Water ───────────────────────────────────────────────────────────────────

export interface WaterConfig {
  bottleSizeMl: number;
  dailyGoalBottles: number;
}

export interface WaterLog {
  id: string;
  timestamp: string;
  bottleCount: number;
  totalMl: number;
}

// ─── Food ────────────────────────────────────────────────────────────────────

export type FoodCategory =
  | "south_indian"
  | "north_indian"
  | "snacks"
  | "beverages"
  | "non_veg"
  | "fruits"
  | "custom";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type FoodSource = "local" | "api" | "custom" | "ai_estimate";

export interface FoodItem {
  id: string;
  name: string;
  nameLocal?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  category: FoodCategory;
  tags: string[];
  source: FoodSource;
}

export interface MealEntry {
  id: string;
  foodItem: FoodItem;
  quantity: number;
  mealType: MealType;
  timestamp: string;
  calories: number;
}

export interface DailyFoodLog {
  date: string;
  entries: MealEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  isMIT: boolean;
  isCompleted: boolean;
  createdAt: string;
  completedAt?: string;
  focusSessionId?: string;
}

// ─── Focus ───────────────────────────────────────────────────────────────────

export type FocusSessionType = "work" | "break";

export interface FocusSession {
  id: string;
  taskId?: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  isCompleted: boolean;
  type: FocusSessionType;
}

export interface FocusConfig {
  workMinutes: number;
  breakMinutes: number;
  sessionsBeforeLongBreak: number;
}

// ─── Habits ──────────────────────────────────────────────────────────────────

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface HabitStreak {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  last7Days: boolean[];
}

// ─── Sleep ───────────────────────────────────────────────────────────────────

export type QualityRating = 1 | 2 | 3 | 4 | 5;

export interface SleepLog {
  id: string;
  date: string;
  bedTime: string;
  wakeTime: string;
  durationHours: number;
  qualityRating: QualityRating;
  notes?: string;
}

// ─── Exercise ────────────────────────────────────────────────────────────────

export type ExerciseType =
  | "walk"
  | "run"
  | "gym"
  | "yoga"
  | "cycling"
  | "swimming"
  | "home_workout"
  | "sports"
  | "other";

export type IntensityLevel = "light" | "moderate" | "intense";

export interface WorkoutLog {
  id: string;
  date: string;
  exerciseType: ExerciseType;
  durationMinutes: number;
  intensityLevel: IntensityLevel;
  caloriesBurned: number;
  notes?: string;
}

// ─── Body Metrics ─────────────────────────────────────────────────────────────

export interface BodyMetricLog {
  id: string;
  date: string;
  weightKg: number;
  notes?: string;
}

// ─── Steps ───────────────────────────────────────────────────────────────────

export interface StepLog {
  date: string;
  steps: number;
  goalSteps: number;
}

// ─── Mood ────────────────────────────────────────────────────────────────────

export type MoodRating = 1 | 2 | 3 | 4 | 5;

export interface MoodLog {
  date: string;
  morningMood?: MoodRating;
  eveningMood?: MoodRating;
  stressLevel?: number;
}

// ─── Journal ─────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  timestamp: string;
  content: string;
  tags?: string[];
}

// ─── Gratitude ───────────────────────────────────────────────────────────────

export interface GratitudeEntry {
  id: string;
  date: string;
  items: string[];
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export type AIProvider =
  | "openai"
  | "anthropic"
  | "openrouter"
  | "groq"
  | "gemini"
  | "ollama";

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseURL: string;
  isConnected: boolean;
}

export type AIMessageRole = "user" | "assistant" | "system";

export interface AIMessage {
  role: AIMessageRole;
  content: string;
  timestamp: string;
}

export interface AIChatSession {
  id: string;
  messages: AIMessage[];
  createdAt: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface NotificationConfig {
  waterReminder: {
    enabled: boolean;
    times: string[];
  };
  mealReminder: {
    enabled: boolean;
    breakfastTime: string;
    lunchTime: string;
    dinnerTime: string;
  };
  focusReminder: {
    enabled: boolean;
    time: string;
  };
  eveningCheckin: {
    enabled: boolean;
    time: string;
  };
  morningBriefing: {
    enabled: boolean;
    time: string;
  };
}

// ─── App State ───────────────────────────────────────────────────────────────

export interface DayScore {
  tasksPercent: number;
  caloriesPercent: number;
  waterPercent: number;
  habitsPercent: number;
  overall: number;
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

// ─── Daily Summary (AI Context) ──────────────────────────────────────────────

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface DailyContext {
  profile: UserProfile;
  date: string;
  timeOfDay: TimeOfDay;
  food: DailyFoodLog;
  water: {
    bottlesConsumed: number;
    goalBottles: number;
    mlConsumed: number;
  };
  tasks: {
    total: number;
    completed: number;
    mitCompleted: boolean;
  };
  habits: {
    total: number;
    completed: number;
    list: string[];
  };
  focus: {
    sessionsCompleted: number;
    totalMinutes: number;
  };
  sleep?: SleepLog;
  workout?: WorkoutLog;
  mood?: MoodLog;
  steps?: StepLog;
  weight?: BodyMetricLog;
  dayScore: DayScore;
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export type OnboardingStep =
  | "welcome"
  | "body"
  | "activity"
  | "water"
  | "sleep"
  | "ai";
