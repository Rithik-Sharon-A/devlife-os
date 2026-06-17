import type {
  ActivityLevel,
  DailyContext,
  DayScore,
  ExerciseType,
  GoalType,
  IntensityLevel,
} from "../types";

/** WHO BMI classification categories. */
export type BMICategory = "underweight" | "normal" | "overweight" | "obese";

export interface BMIResult {
  bmi: number;
  category: BMICategory;
}

export interface WeightLossTimeline {
  weeksToGoal: number;
  expectedDate: string;
  weeklyLossKg: number;
}

export interface WaterGoalResult {
  totalMl: number;
  bottleCount: number;
}

/** Activity multipliers for TDEE (Harris-Benedict revision / common clinical use). */
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
};

/** Metabolic Equivalent of Task values (kcal/kg/hour). */
const EXERCISE_MET: Record<Exclude<ExerciseType, "other">, number> = {
  walk: 3.5,
  run: 8.0,
  gym: 5.0,
  yoga: 2.5,
  cycling: 7.5,
  swimming: 6.0,
  home_workout: 4.0,
  sports: 6.0,
};

/** Intensity adjustment factors applied to base MET calorie burn. */
const INTENSITY_MULTIPLIERS: Record<IntensityLevel, number> = {
  light: 0.8,
  moderate: 1.0,
  intense: 1.2,
};

/** Approximate kcal deficit required to lose 1 kg of body fat. */
const KCAL_PER_KG_FAT = 7700;

/**
 * Calculates Basal Metabolic Rate using the Mifflin-St Jeor equation.
 *
 * Most accurate predictive equation for the general adult population.
 *
 * @param weightKg - Body weight in kilograms
 * @param heightCm - Height in centimeters
 * @param age - Age in years
 * @param gender - Biological sex used for the gender constant
 * @returns Estimated BMR in kcal/day
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female" | "other",
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  if (gender === "male") {
    return base + 5;
  }

  if (gender === "female") {
    return base - 161;
  }

  // Average of male (+5) and female (-161) constants for non-binary/other
  return base - 78;
}

/**
 * Calculates Total Daily Energy Expenditure from BMR and activity level.
 *
 * @param bmr - Basal metabolic rate in kcal/day
 * @param activityLevel - Self-reported daily activity tier
 * @returns Estimated TDEE in kcal/day
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Derives a daily calorie target from TDEE based on the user's goal.
 *
 * @param tdee - Total daily energy expenditure in kcal/day
 * @param goalType - Weight management objective
 * @returns Recommended daily calorie intake in kcal/day
 */
export function calculateDailyCalorieGoal(
  tdee: number,
  goalType: GoalType,
): number {
  switch (goalType) {
    case "weight_loss":
      return Math.round(tdee - 500);
    case "weight_gain":
      return Math.round(tdee + 300);
    case "maintain":
      return Math.round(tdee);
  }
}

/**
 * Estimates calories burned during exercise using MET values.
 *
 * Formula: MET × weight(kg) × duration(hours) × intensity factor
 *
 * @param exerciseType - Type of physical activity
 * @param durationMinutes - Duration of the session in minutes
 * @param weightKg - Body weight in kilograms
 * @param intensityLevel - Perceived exertion level
 * @returns Estimated calories burned in kcal
 */
export function calculateCaloriesBurned(
  exerciseType: ExerciseType,
  durationMinutes: number,
  weightKg: number,
  intensityLevel: IntensityLevel,
): number {
  const met =
    exerciseType === "other" ? 4.0 : EXERCISE_MET[exerciseType];
  const hours = durationMinutes / 60;
  const baseBurn = met * weightKg * hours;
  const adjusted = baseBurn * INTENSITY_MULTIPLIERS[intensityLevel];

  return Math.round(adjusted);
}

/**
 * Scores calorie adherence relative to the daily goal.
 *
 * Returns 100 when intake is within ±100 kcal of the target; decreases
 * linearly beyond that tolerance.
 */
function scoreCalorieAdherence(consumed: number, goal: number): number {
  if (goal <= 0) {
    return 100;
  }

  const diff = Math.abs(consumed - goal);

  if (diff <= 100) {
    return 100;
  }

  const penalty = ((diff - 100) / goal) * 100;
  return Math.max(0, Math.round(100 - penalty));
}

/**
 * Computes a percentage from a completed/total ratio, capped at 100.
 * Returns 100 when total is zero (nothing required).
 */
function ratioPercent(completed: number, total: number): number {
  if (total <= 0) {
    return 100;
  }

  return Math.min(100, Math.round((completed / total) * 100));
}

/**
 * Calculates the composite DayOS daily performance score.
 *
 * Weighting: tasks 30%, calories 25%, water 25%, habits 20%.
 *
 * @param context - Full daily snapshot including food, water, tasks, and habits
 * @returns Breakdown and weighted overall score (0–100)
 */
export function calculateDayScore(context: DailyContext): DayScore {
  const { tasks, habits, water, food, profile } = context;

  const tasksPercent = ratioPercent(tasks.completed, tasks.total);
  const caloriesPercent = scoreCalorieAdherence(
    food.totalCalories,
    profile.dailyCalorieGoal,
  );
  const waterPercent = ratioPercent(water.bottlesConsumed, water.goalBottles);
  const habitsPercent = ratioPercent(habits.completed, habits.total);

  const overall = Math.round(
    tasksPercent * 0.3 +
      caloriesPercent * 0.25 +
      waterPercent * 0.25 +
      habitsPercent * 0.2,
  );

  return {
    tasksPercent,
    caloriesPercent,
    waterPercent,
    habitsPercent,
    overall,
  };
}

/**
 * Calculates daily protein target based on body weight and goal.
 *
 * Higher protein during weight loss helps preserve lean mass.
 *
 * @param weightKg - Current body weight in kilograms
 * @param goalType - Weight management objective
 * @returns Recommended daily protein intake in grams
 */
export function calculateProteinGoal(
  weightKg: number,
  goalType: GoalType,
): number {
  const gramsPerKg: Record<GoalType, number> = {
    weight_loss: 2.0,
    weight_gain: 1.8,
    maintain: 1.6,
  };

  return Math.round(weightKg * gramsPerKg[goalType]);
}

/**
 * Projects a weight-loss timeline given a sustained daily calorie deficit.
 *
 * Uses the ~7700 kcal/kg fat energy density approximation.
 *
 * @param currentWeight - Starting weight in kg
 * @param goalWeight - Target weight in kg
 * @param dailyDeficit - Average daily calorie deficit in kcal
 * @returns Estimated weeks to goal, target date (ISO date), and weekly loss rate
 */
export function estimateWeightLossTimeline(
  currentWeight: number,
  goalWeight: number,
  dailyDeficit: number,
): WeightLossTimeline {
  const weightToLose = currentWeight - goalWeight;

  if (weightToLose <= 0 || dailyDeficit <= 0) {
    return {
      weeksToGoal: 0,
      expectedDate: new Date().toISOString().slice(0, 10),
      weeklyLossKg: 0,
    };
  }

  const weeklyLossKg = (dailyDeficit * 7) / KCAL_PER_KG_FAT;
  const weeksToGoal = weightToLose / weeklyLossKg;

  const expected = new Date();
  expected.setDate(expected.getDate() + Math.ceil(weeksToGoal * 7));

  return {
    weeksToGoal: Math.round(weeksToGoal * 10) / 10,
    expectedDate: expected.toISOString().slice(0, 10),
    weeklyLossKg: Math.round(weeklyLossKg * 100) / 100,
  };
}

/**
 * Calculates Body Mass Index and WHO classification.
 *
 * @param weightKg - Body weight in kilograms
 * @param heightCm - Height in centimeters
 * @returns BMI value (1 decimal) and category
 */
export function calculateBMI(weightKg: number, heightCm: number): BMIResult {
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  let category: BMICategory;

  if (bmi < 18.5) {
    category = "underweight";
  } else if (bmi < 25) {
    category = "normal";
  } else if (bmi < 30) {
    category = "overweight";
  } else {
    category = "obese";
  }

  return { bmi, category };
}

/**
 * Calculates daily water intake goal from body weight.
 *
 * Formula: 35 ml per kg of body weight, rounded to the nearest 250 ml.
 *
 * @param weightKg - Body weight in kilograms
 * @param bottleSizeMl - Volume of one water bottle in ml (default 500)
 * @returns Total daily ml target and number of bottles to drink
 */
export function calculateWaterGoal(
  weightKg: number,
  bottleSizeMl = 500,
): WaterGoalResult {
  const rawMl = weightKg * 35;
  const totalMl = Math.round(rawMl / 250) * 250;
  const bottleCount = Math.ceil(totalMl / bottleSizeMl);

  return { totalMl, bottleCount };
}
