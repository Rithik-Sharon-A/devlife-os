import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { uiTheme } from "../../components/ui/theme";
import type { ActivityLevel } from "../../types";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { OnboardingShell } from "./components/OnboardingShell";
import { useOnboardingStep } from "./_layout";

const activityOptions: Array<{
  level: ActivityLevel;
  icon: string;
  title: string;
  subtitle: string;
}> = [
  {
    level: "sedentary",
    icon: "🪑",
    title: "Sedentary",
    subtitle: "Mostly desk work, little movement",
  },
  {
    level: "lightly_active",
    icon: "🚶",
    title: "Lightly Active",
    subtitle: "Walk sometimes, light exercise 1-3x/week",
  },
  {
    level: "moderately_active",
    icon: "🏃",
    title: "Moderately Active",
    subtitle: "Exercise 3-5x/week regularly",
  },
  {
    level: "very_active",
    icon: "⚡",
    title: "Very Active",
    subtitle: "Daily intense training or physical job",
  },
];

export default function OnboardingActivity() {
  const step = useOnboardingStep();
  const { activityLevel, dailyCalorieGoal, updateDraft, recalcMetabolism } =
    useOnboardingStore();

  useEffect(() => {
    recalcMetabolism();
  }, [activityLevel, recalcMetabolism]);

  const onNext = () => {
    recalcMetabolism();
    router.push("/onboarding/water");
  };

  return (
    <OnboardingShell step={step} footer={<Button label="Continue" onPress={onNext} />}>
      <Text style={styles.title}>Activity level</Text>
      <Text style={styles.subtitle}>
        This fine-tunes your calorie target based on how much you move.
      </Text>

      <View style={styles.list}>
        {activityOptions.map((option) => {
          const active = activityLevel === option.level;
          return (
            <Pressable
              key={option.level}
              onPress={() => {
                updateDraft({ activityLevel: option.level });
              }}
            >
              <Card
                variant={active ? "elevated" : "bordered"}
                style={[styles.card, active && styles.cardActive]}
              >
                <Text style={styles.icon}>{option.icon}</Text>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{option.title}</Text>
                  <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {dailyCalorieGoal > 0 ? (
        <Card variant="bordered" style={styles.preview}>
          <Text style={styles.previewLabel}>Your daily goal</Text>
          <Text style={styles.previewValue}>
            {dailyCalorieGoal.toLocaleString()} kcal
          </Text>
        </Card>
      ) : null}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  title: {
    color: uiTheme.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 12,
  },
  subtitle: {
    color: uiTheme.textSecondary,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    marginTop: 20,
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardActive: {
    borderWidth: 1,
    borderColor: uiTheme.accent,
  },
  icon: {
    fontSize: 28,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: uiTheme.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  cardSubtitle: {
    color: uiTheme.textSecondary,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  preview: {
    marginTop: 20,
  },
  previewLabel: {
    color: uiTheme.textSecondary,
    fontSize: 13,
  },
  previewValue: {
    color: uiTheme.accent,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
});
