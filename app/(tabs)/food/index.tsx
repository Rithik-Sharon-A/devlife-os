import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CalorieBar } from "../../../components/food/CalorieBar";
import { MacroPills } from "../../../components/food/MacroPills";
import { MealSection } from "../../../components/food/MealSection";
import { NutritionSummary } from "../../../components/food/NutritionSummary";
import { useCelebrationContext } from "../../../components/providers/CelebrationProvider";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { AnimatedCard } from "../../../components/ui/MicroAnimations";
import { uiTheme } from "../../../components/ui/theme";
import { useAI } from "../../../hooks/useAI";
import { useAppStore } from "../../../store/useAppStore";
import type { FoodItem, GoalType, MealEntry, MealType } from "../../../types";
import { getLast7Days, getNowString } from "../../../utils/date";
import {
  inferMealType,
  MEAL_TITLES,
  navigateToAddMeal,
  navigateToMealDetail,
} from "../../../utils/foodNavigation";
import * as storage from "../../../utils/storage";
import { calculateProteinGoal } from "../../../utils/tdee";

const MEALS: Array<{ type: MealType; title: string }> = [
  { type: "breakfast", title: "Breakfast" },
  { type: "lunch", title: "Lunch" },
  { type: "dinner", title: "Dinner" },
  { type: "snack", title: "Snacks" },
];

const GOAL_LABELS: Record<GoalType, string> = {
  weight_loss: "Weight Loss",
  maintain: "Maintain",
  weight_gain: "Gain Weight",
};

interface FrequentFood {
  item: FoodItem;
  quantity: number;
  count: number;
}

interface ParsedSuggestion {
  name: string;
  calories: number;
}

function mealTitle(type: MealType): string {
  return MEAL_TITLES[type] ?? type;
}

function entryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function loadFrequentFoods(): Promise<FrequentFood[]> {
  const map = new Map<string, FrequentFood>();

  for (const date of getLast7Days()) {
    const log = await storage.getFoodLog(date);
    if (!log) continue;

    for (const entry of log.entries) {
      const key = entry.foodItem.id;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.quantity = entry.quantity;
      } else {
        map.set(key, {
          item: entry.foodItem,
          quantity: entry.quantity,
          count: 1,
        });
      }
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 8);
}

function parseMealSuggestions(text: string): ParsedSuggestion[] {
  const results: ParsedSuggestion[] = [];

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(
      /^\d+[\.)]\s*(.+?)(?:\s*[-–—,]|\s+)\s*(\d+)\s*kcal/i
    );
    if (match) {
      results.push({
        name: match[1]!.trim().replace(/\s*\(.*\)$/, ""),
        calories: Number(match[2]),
      });
    }
  }

  return results;
}

function suggestionToFoodItem(suggestion: ParsedSuggestion): FoodItem {
  const { name, calories } = suggestion;
  return {
    id: `ai_suggest_${entryId()}`,
    name,
    calories,
    protein: Math.round((calories * 0.25) / 4),
    carbs: Math.round((calories * 0.45) / 4),
    fat: Math.round((calories * 0.3) / 9),
    servingSize: 1,
    servingUnit: "serving",
    category: "custom",
    tags: ["ai_suggestion"],
    source: "ai_estimate",
  };
}

function estimateFiber(carbs: number, entryCount: number): number {
  return Math.round(carbs * 0.1 + entryCount * 1.5);
}

export default function FoodScreen() {
  const { celebrate } = useCelebrationContext();
  const profile = useAppStore((s) => s.profile);
  const aiConfig = useAppStore((s) => s.aiConfig);
  const todayFoodLog = useAppStore((s) => s.todayFoodLog);
  const addMealEntry = useAppStore((s) => s.addMealEntry);

  const { getMealSuggestion } = useAI();

  const [suggestionMeal, setSuggestionMeal] = useState<MealType>(inferMealType);
  const [suggestionText, setSuggestionText] = useState<string | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const isAiConfigured = Boolean(aiConfig?.apiKey && aiConfig.model);

  const calorieGoal = profile?.dailyCalorieGoal ?? 2000;
  const consumed = todayFoodLog.totalCalories;
  const remaining = Math.max(0, calorieGoal - consumed);
  const isOverGoal = consumed > calorieGoal;

  const proteinGoal = profile
    ? calculateProteinGoal(profile.weightKg, profile.goalType)
    : 120;
  const carbGoal = Math.round((calorieGoal * 0.45) / 4);
  const fatGoal = Math.round((calorieGoal * 0.3) / 9);
  const fiber = estimateFiber(todayFoodLog.totalCarbs, todayFoodLog.entries.length);

  const hour = new Date().getHours();
  const showUnderEatenNudge =
    hour >= 20 && remaining > 500 && !isOverGoal;

  const [frequentFoods, setFrequentFoods] = useState<FrequentFood[]>([]);
  const prevEntryCountRef = useRef(todayFoodLog.entries.length);

  useEffect(() => {
    void loadFrequentFoods().then(setFrequentFoods);
  }, [todayFoodLog.entries.length]);

  useEffect(() => {
    if (todayFoodLog.entries.length <= prevEntryCountRef.current) {
      prevEntryCountRef.current = todayFoodLog.entries.length;
      return;
    }

    void (async () => {
      if (prevEntryCountRef.current === 0) {
        const firstDone = await AsyncStorage.getItem("dayos:first_food_done");
        if (!firstDone) {
          celebrate("first_food");
          await AsyncStorage.setItem("dayos:first_food_done", "1");
        }
      }

      const diff = Math.abs(calorieGoal - todayFoodLog.totalCalories);
      if (diff <= 50 && todayFoodLog.totalCalories >= calorieGoal - 50) {
        celebrate("calorie_goal");
      }
    })();

    prevEntryCountRef.current = todayFoodLog.entries.length;
  }, [calorieGoal, celebrate, todayFoodLog.entries.length, todayFoodLog.totalCalories]);

  const parsedSuggestions = useMemo(
    () => (suggestionText ? parseMealSuggestions(suggestionText) : []),
    [suggestionText]
  );

  const quickAdd = useCallback(
    (item: FoodItem, quantity: number, mealType: MealType) => {
      const entry: MealEntry = {
        id: entryId(),
        foodItem: item,
        quantity,
        mealType,
        timestamp: getNowString(),
        calories: Math.round(item.calories * quantity),
      };
      addMealEntry(entry);
    },
    [addMealEntry]
  );

  const fetchSuggestion = async () => {
    if (!isAiConfigured) return;
    setSuggestionLoading(true);
    setSuggestionError(null);
    setSuggestionText(null);
    try {
      const text = await getMealSuggestion(suggestionMeal);
      setSuggestionText(text);
    } catch (err) {
      setSuggestionError(
        err instanceof Error ? err.message : "Could not load suggestion."
      );
    } finally {
      setSuggestionLoading(false);
    }
  };

  const logSuggestedMeal = () => {
    const items =
      parsedSuggestions.length > 0
        ? parsedSuggestions
        : suggestionText
          ? [{ name: "AI suggested meal", calories: Math.min(remaining, 400) }]
          : [];

    for (const item of items) {
      const food = suggestionToFoodItem(item);
      quickAdd(food, 1, suggestionMeal);
    }
    setSuggestionText(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.stickyHeader}>
        <CalorieBar consumed={consumed} goal={calorieGoal} />
        <View style={styles.macroRow}>
          <MacroPills
            protein={todayFoodLog.totalProtein}
            carbs={todayFoodLog.totalCarbs}
            fat={todayFoodLog.totalFat}
          />
        </View>
        {profile ? (
          <Badge
            label={`${GOAL_LABELS[profile.goalType]} · ${calorieGoal.toLocaleString()} kcal`}
            color={uiTheme.accent}
          />
        ) : null}

        {isOverGoal ? (
          <Text style={styles.warning}>
            You're {consumed - calorieGoal} kcal over your goal today.
          </Text>
        ) : null}

        {showUnderEatenNudge ? (
          <Text style={styles.nudge}>
            You still have {remaining} kcal left — consider a balanced dinner or snack.
          </Text>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {MEALS.map((meal, index) => (
          <AnimatedCard key={meal.type} delay={index * 60}>
            <MealSection
              mealType={meal.type}
              title={meal.title}
              onRowPress={() => navigateToMealDetail(meal.type)}
              onAddPress={() => navigateToAddMeal(meal.type)}
            />
          </AnimatedCard>
        ))}

        {frequentFoods.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick add</Text>
            <Text style={styles.sectionSub}>Add again from the last 7 days</Text>
            <View style={styles.chips}>
              {frequentFoods.map((freq) => (
                <Pressable
                  key={freq.item.id}
                  style={styles.chip}
                  onPress={() =>
                    quickAdd(freq.item, freq.quantity, inferMealType())
                  }
                >
                  <Text style={styles.chipText}>
                    {freq.item.name} ×{freq.quantity}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Card variant="elevated" style={styles.aiCard}>
            {isAiConfigured ? (
              <>
                <Button
                  label={`💡 What should I eat for ${mealTitle(suggestionMeal)}?`}
                  variant="secondary"
                  onPress={fetchSuggestion}
                  loading={suggestionLoading}
                />

                <View style={styles.mealPick}>
                  {MEALS.map((meal) => (
                    <Pressable
                      key={meal.type}
                      onPress={() => setSuggestionMeal(meal.type)}
                      style={[
                        styles.mealChip,
                        suggestionMeal === meal.type && styles.mealChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.mealChipText,
                          suggestionMeal === meal.type && styles.mealChipTextActive,
                        ]}
                      >
                        {meal.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {suggestionError ? (
                  <Text style={styles.aiError}>{suggestionError}</Text>
                ) : null}

                {suggestionText ? (
                  <View style={styles.suggestionBox}>
                    <Text style={styles.suggestionText}>{suggestionText}</Text>
                    {parsedSuggestions.length > 0 ? (
                      <View style={styles.breakdown}>
                        {parsedSuggestions.map((s) => (
                          <Text key={s.name} style={styles.breakdownLine}>
                            · {s.name} — {s.calories} kcal
                          </Text>
                        ))}
                      </View>
                    ) : null}
                    <Button label="Log this meal" onPress={logSuggestedMeal} />
                  </View>
                ) : null}
              </>
            ) : (
              <Pressable onPress={() => router.push("/(tabs)/settings")}>
                <Text style={styles.aiDisabled}>
                  Add AI key in settings to unlock meal suggestions
                </Text>
              </Pressable>
            )}
          </Card>
        </View>

        <NutritionSummary
          calories={consumed}
          calorieGoal={calorieGoal}
          protein={todayFoodLog.totalProtein}
          proteinGoal={proteinGoal}
          carbs={todayFoodLog.totalCarbs}
          carbGoal={carbGoal}
          fat={todayFoodLog.totalFat}
          fatGoal={fatGoal}
          fiber={fiber}
          highlightProtein={profile?.goalType === "weight_loss"}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: uiTheme.background,
  },
  stickyHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.border,
    backgroundColor: uiTheme.background,
  },
  macroRow: {
    marginTop: 2,
  },
  warning: {
    color: uiTheme.danger,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  nudge: {
    color: uiTheme.warning,
    fontSize: 13,
    lineHeight: 18,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: uiTheme.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  sectionSub: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 10,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: uiTheme.border,
    backgroundColor: uiTheme.surface2,
    borderRadius: uiTheme.radiusPill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    color: uiTheme.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  aiCard: {
    gap: 12,
  },
  mealPick: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  mealChip: {
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusPill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: uiTheme.surface2,
  },
  mealChipActive: {
    borderColor: uiTheme.accent,
    backgroundColor: uiTheme.surface3,
  },
  mealChipText: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  mealChipTextActive: {
    color: uiTheme.textPrimary,
  },
  aiError: {
    color: uiTheme.danger,
    fontSize: 13,
  },
  aiDisabled: {
    color: uiTheme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    paddingVertical: 8,
  },
  suggestionBox: {
    gap: 10,
    marginTop: 4,
  },
  suggestionText: {
    color: uiTheme.textPrimary,
    fontSize: 14,
    lineHeight: 21,
  },
  breakdown: {
    gap: 4,
  },
  breakdownLine: {
    color: uiTheme.textSecondary,
    fontSize: 13,
  },
});
