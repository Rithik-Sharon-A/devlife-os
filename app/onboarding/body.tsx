import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { uiTheme } from "../../components/ui/theme";
import type { GoalType } from "../../types";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { OnboardingShell } from "./components/OnboardingShell";
import { useOnboardingStep } from "./_layout";

type HeightUnit = "cm" | "ft";
type WeightUnit = "kg" | "lbs";

const goalOptions: Array<{
  type: GoalType;
  icon: string;
  title: string;
  subtitle: string;
}> = [
  {
    type: "weight_loss",
    icon: "🔻",
    title: "Lose Weight",
    subtitle: "Burn fat, feel lighter",
  },
  {
    type: "maintain",
    icon: "⚖️",
    title: "Maintain",
    subtitle: "Stay where you are",
  },
  {
    type: "weight_gain",
    icon: "💪",
    title: "Gain Weight",
    subtitle: "Build mass, get stronger",
  },
];

function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

function cmToFtDisplay(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

function ftDisplayToCm(value: string): number | null {
  const match = value.match(/^(\d+)[''](\d{1,2})"?$/);
  if (!match) return null;
  const feet = Number(match[1]);
  const inches = Number(match[2]);
  if (Number.isNaN(feet) || Number.isNaN(inches)) return null;
  return Math.round((feet * 12 + inches) * 2.54);
}

export default function OnboardingBody() {
  const step = useOnboardingStep();
  const draft = useOnboardingStore();
  const { updateDraft, recalcMetabolism } = useOnboardingStore();
  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [heightInput, setHeightInput] = useState(String(draft.heightCm));
  const [weightInput, setWeightInput] = useState(String(draft.weightKg));
  const [goalWeightInput, setGoalWeightInput] = useState(String(draft.goalWeightKg));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (heightUnit === "cm") setHeightInput(String(draft.heightCm));
    else setHeightInput(cmToFtDisplay(draft.heightCm));
  }, [draft.heightCm, heightUnit]);

  useEffect(() => {
    if (weightUnit === "kg") {
      setWeightInput(String(draft.weightKg));
      setGoalWeightInput(String(draft.goalWeightKg));
    } else {
      setWeightInput(String(kgToLbs(draft.weightKg)));
      setGoalWeightInput(String(kgToLbs(draft.goalWeightKg)));
    }
  }, [draft.goalWeightKg, draft.weightKg, weightUnit]);

  useEffect(() => {
    recalcMetabolism();
  }, [
    draft.heightCm,
    draft.weightKg,
    draft.goalType,
    draft.gender,
    draft.age,
    recalcMetabolism,
  ]);

  const caloriePreview = useMemo(() => {
    if (!draft.dailyCalorieGoal) return null;
    return draft.dailyCalorieGoal.toLocaleString();
  }, [draft.dailyCalorieGoal]);

  const onNext = () => {
    const heightCm =
      heightUnit === "cm"
        ? Number(heightInput)
        : ftDisplayToCm(heightInput) ?? 0;

    const weightKg =
      weightUnit === "kg" ? Number(weightInput) : lbsToKg(Number(weightInput));
    const goalWeightKg =
      weightUnit === "kg"
        ? Number(goalWeightInput)
        : lbsToKg(Number(goalWeightInput));

    if (!heightCm || heightCm < 120 || heightCm > 230) {
      setError("Enter a valid height.");
      return;
    }
    if (!weightKg || weightKg < 30 || weightKg > 250) {
      setError("Enter a valid current weight.");
      return;
    }
    if (!goalWeightKg || goalWeightKg < 30 || goalWeightKg > 250) {
      setError("Enter a valid goal weight.");
      return;
    }

    updateDraft({ heightCm, weightKg, goalWeightKg });
    recalcMetabolism();
    router.push("/onboarding/activity");
  };

  return (
    <OnboardingShell step={step} footer={<Button label="Continue" onPress={onNext} />}>
      <Text style={styles.title}>Body stats</Text>
      <Text style={styles.subtitle}>We'll calculate your daily calorie target.</Text>

      <View style={styles.form}>
        <UnitToggle
          left="cm"
          right="ft"
          active={heightUnit}
          onChange={(unit) => setHeightUnit(unit as HeightUnit)}
        />
        <Input
          label={`Height (${heightUnit})`}
          value={heightInput}
          onChangeText={(text) => {
            setError(null);
            setHeightInput(text);
            if (heightUnit === "cm") {
              const cm = Number(text);
              if (!Number.isNaN(cm) && cm > 0) updateDraft({ heightCm: cm });
            } else {
              const cm = ftDisplayToCm(text);
              if (cm) updateDraft({ heightCm: cm });
            }
          }}
          placeholder={heightUnit === "cm" ? "170" : "5'7\""}
          keyboardType={heightUnit === "cm" ? "number-pad" : "default"}
        />

        <UnitToggle
          left="kg"
          right="lbs"
          active={weightUnit}
          onChange={(unit) => setWeightUnit(unit as WeightUnit)}
        />
        <Input
          label={`Current weight (${weightUnit})`}
          value={weightInput}
          onChangeText={(text) => {
            setError(null);
            setWeightInput(text);
            const val = Number(text);
            if (!Number.isNaN(val) && val > 0) {
              updateDraft({
                weightKg: weightUnit === "kg" ? val : lbsToKg(val),
              });
            }
          }}
          placeholder={weightUnit === "kg" ? "72" : "159"}
          keyboardType="decimal-pad"
        />
        <Input
          label={`Goal weight (${weightUnit})`}
          value={goalWeightInput}
          onChangeText={(text) => {
            setError(null);
            setGoalWeightInput(text);
            const val = Number(text);
            if (!Number.isNaN(val) && val > 0) {
              updateDraft({
                goalWeightKg: weightUnit === "kg" ? val : lbsToKg(val),
              });
            }
          }}
          placeholder={weightUnit === "kg" ? "68" : "150"}
          keyboardType="decimal-pad"
        />

        <Text style={styles.sectionLabel}>Goal type</Text>
        <View style={styles.goalGrid}>
          {goalOptions.map((goal) => {
            const active = draft.goalType === goal.type;
            return (
              <Pressable
                key={goal.type}
                onPress={() => {
                  setError(null);
                  updateDraft({ goalType: goal.type });
                }}
              >
                <Card
                  variant={active ? "elevated" : "bordered"}
                  style={[styles.goalCard, active && styles.goalCardActive]}
                >
                  <Text style={styles.goalIcon}>{goal.icon}</Text>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                  <Text style={styles.goalSubtitle}>{goal.subtitle}</Text>
                </Card>
              </Pressable>
            );
          })}
        </View>

        {caloriePreview ? (
          <Card variant="bordered" style={styles.preview}>
            <Text style={styles.previewLabel}>Your daily goal</Text>
            <Text style={styles.previewValue}>{caloriePreview} kcal</Text>
          </Card>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </OnboardingShell>
  );
}

function UnitToggle({
  left,
  right,
  active,
  onChange,
}: {
  left: string;
  right: string;
  active: string;
  onChange: (unit: string) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      {[left, right].map((unit) => (
        <Pressable
          key={unit}
          onPress={() => onChange(unit)}
          style={[styles.toggle, active === unit && styles.toggleActive]}
        >
          <Text style={[styles.toggleText, active === unit && styles.toggleTextActive]}>
            {unit}
          </Text>
        </Pressable>
      ))}
    </View>
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
  sectionLabel: {
    color: uiTheme.textSecondary,
    fontWeight: "600",
    fontSize: 13,
    marginTop: 4,
  },
  goalGrid: {
    gap: 10,
  },
  goalCard: {
    marginBottom: 0,
  },
  goalCardActive: {
    borderWidth: 1,
    borderColor: uiTheme.accent,
  },
  goalIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  goalTitle: {
    color: uiTheme.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  goalSubtitle: {
    color: uiTheme.textSecondary,
    marginTop: 4,
    fontSize: 13,
  },
  preview: {
    marginTop: 4,
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
  error: {
    color: uiTheme.danger,
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
  },
  toggle: {
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusPill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: uiTheme.surface2,
  },
  toggleActive: {
    borderColor: uiTheme.accent,
    backgroundColor: uiTheme.surface3,
  },
  toggleText: {
    color: uiTheme.textSecondary,
    fontWeight: "600",
    fontSize: 12,
  },
  toggleTextActive: {
    color: uiTheme.textPrimary,
  },
});
