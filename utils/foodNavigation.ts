import { router } from "expo-router";

import type { MealType } from "../types";

export const MEAL_TITLES: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

export function inferMealType(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 20) return "dinner";
  return "snack";
}

export function parseMealParam(value: string | string[] | undefined): MealType {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "lunch" || raw === "dinner" || raw === "snack") return raw;
  return "breakfast";
}

export function navigateToAddMeal(mealType: MealType) {
  router.push({
    pathname: "/(tabs)/food/add-meal",
    params: { meal: mealType },
  });
}

export function navigateToMealDetail(mealType: MealType) {
  router.push({
    pathname: "/(tabs)/food/meal-detail",
    params: { meal: mealType },
  });
}
