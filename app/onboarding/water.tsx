import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { uiTheme } from "../../components/ui/theme";
import { calculateWaterGoal } from "../../utils/tdee";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { OnboardingShell } from "./components/OnboardingShell";
import { useOnboardingStep } from "./_layout";

const BOTTLE_SIZES = [300, 500, 750, 1000, 1500];

export default function OnboardingWater() {
  const step = useOnboardingStep();
  const { weightKg, bottleSizeMl, dailyGoalBottles, updateDraft, recalcWaterGoal } =
    useOnboardingStore();
  const [bottleInput, setBottleInput] = useState(String(bottleSizeMl));
  const [goalOverride, setGoalOverride] = useState(String(dailyGoalBottles));
  const [customGoal, setCustomGoal] = useState(false);

  const recommendation = useMemo(
    () => calculateWaterGoal(weightKg, bottleSizeMl),
    [weightKg, bottleSizeMl]
  );

  useEffect(() => {
    if (!customGoal) {
      recalcWaterGoal();
      setGoalOverride(String(recommendation.bottleCount));
    }
  }, [bottleSizeMl, weightKg, customGoal, recalcWaterGoal, recommendation.bottleCount]);

  useEffect(() => {
    setBottleInput(String(bottleSizeMl));
  }, [bottleSizeMl]);

  useEffect(() => {
    if (!customGoal) setGoalOverride(String(dailyGoalBottles));
  }, [dailyGoalBottles, customGoal]);

  const onNext = () => {
    const size = Number(bottleInput);
    const bottles = Number(goalOverride);
    if (!size || size < 100) return;
    if (!bottles || bottles < 1) return;

    updateDraft({
      bottleSizeMl: size,
      dailyGoalBottles: bottles,
    });
    router.push("/onboarding/sleep");
  };

  return (
    <OnboardingShell step={step} footer={<Button label="Continue" onPress={onNext} />}>
      <Text style={styles.title}>What's your water bottle size?</Text>
      <Text style={styles.subtitle}>
        We'll recommend how many bottles to drink each day.
      </Text>

      <View style={styles.form}>
        <Input
          label="Bottle size (ml)"
          value={bottleInput}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9]/g, "");
            setBottleInput(cleaned);
            const val = Number(cleaned);
            if (val > 0) {
              updateDraft({ bottleSizeMl: val });
              if (!customGoal) recalcWaterGoal();
            }
          }}
          keyboardType="number-pad"
          placeholder="750"
        />

        <View style={styles.chips}>
          {BOTTLE_SIZES.map((size) => {
            const active = bottleSizeMl === size;
            return (
              <Pressable
                key={size}
                onPress={() => {
                  setBottleInput(String(size));
                  updateDraft({ bottleSizeMl: size });
                  if (!customGoal) recalcWaterGoal();
                }}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {size}ml
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Card variant="bordered" style={styles.recommend}>
          <Text style={styles.recommendText}>
            Your recommended daily goal:{" "}
            <Text style={styles.recommendStrong}>
              {recommendation.bottleCount} bottles ({recommendation.totalMl}ml)
            </Text>
          </Text>
        </Card>

        <Input
          label="Daily bottle goal"
          value={goalOverride}
          onChangeText={(text) => {
            setCustomGoal(true);
            const cleaned = text.replace(/[^0-9]/g, "");
            setGoalOverride(cleaned);
            const val = Number(cleaned);
            if (val > 0) updateDraft({ dailyGoalBottles: val });
          }}
          keyboardType="number-pad"
          placeholder={String(recommendation.bottleCount)}
        />
        <Pressable
          onPress={() => {
            setCustomGoal(false);
            recalcWaterGoal();
          }}
        >
          <Text style={styles.resetLink}>Reset to recommended</Text>
        </Pressable>
      </View>
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
  },
  form: {
    marginTop: 20,
    gap: 14,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusPill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: uiTheme.surface2,
  },
  chipActive: {
    borderColor: uiTheme.accent,
    backgroundColor: uiTheme.surface3,
  },
  chipText: {
    color: uiTheme.textSecondary,
    fontWeight: "600",
    fontSize: 13,
  },
  chipTextActive: {
    color: uiTheme.textPrimary,
  },
  recommend: {
    marginTop: 4,
  },
  recommendText: {
    color: uiTheme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  recommendStrong: {
    color: uiTheme.accent,
    fontWeight: "700",
  },
  resetLink: {
    color: uiTheme.accent,
    fontSize: 13,
    fontWeight: "600",
    marginTop: -6,
  },
});
