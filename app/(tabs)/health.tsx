import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Rect } from "react-native-svg";

import { TimePickerField } from "../../components/onboarding/TimePickerField";
import { useCelebrationContext } from "../../components/providers/CelebrationProvider";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { MoodSelector } from "../../components/ui/MoodSelector";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { useTheme } from "../../context/ThemeContext";
import { useStepCounter } from "../../hooks/useStepCounter";
import { useAppStore } from "../../store/useAppStore";
import type {
  ExerciseType,
  IntensityLevel,
  QualityRating,
} from "../../types";
import { spacing } from "../../utils/designTokens";
import * as storage from "../../utils/storage";
import {
  calculateBMI,
  calculateCaloriesBurned,
  type BMICategory,
  type BMIResult,
} from "../../utils/tdee";
import { typography } from "../../utils/typography";

type SheetKind = "steps" | "sleep" | "workout" | "weight" | null;

const EXERCISES: Array<{ type: ExerciseType; label: string; icon: string }> = [
  { type: "walk", label: "Walk", icon: "🚶" },
  { type: "run", label: "Run", icon: "🏃" },
  { type: "gym", label: "Gym", icon: "🏋️" },
  { type: "yoga", label: "Yoga", icon: "🧘" },
  { type: "cycling", label: "Cycle", icon: "🚴" },
  { type: "swimming", label: "Swim", icon: "🏊" },
  { type: "home_workout", label: "Home", icon: "🏠" },
  { type: "sports", label: "Sports", icon: "⚽" },
];

const EXERCISE_LABELS: Record<ExerciseType, string> = {
  walk: "Walk",
  run: "Run",
  gym: "Gym",
  yoga: "Yoga",
  cycling: "Cycle",
  swimming: "Swim",
  home_workout: "Home workout",
  sports: "Sports",
  other: "Workout",
};

const BMI_COLORS: Record<BMICategory, string> = {
  underweight: "#0ea5e9",
  normal: "#34d399",
  overweight: "#fbbf24",
  obese: "#f87171",
};

const BMI_LABELS: Record<BMICategory, string> = {
  underweight: "Underweight",
  normal: "Normal",
  overweight: "Overweight",
  obese: "Obese",
};

function formatSleep(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatTime12(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function sleepDurationHours(bed: string, wake: string): number {
  const [bh, bm] = bed.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  if ([bh, bm, wh, wm].some((v) => Number.isNaN(v))) return 0;
  let start = bh! * 60 + bm!;
  let end = wh! * 60 + wm!;
  if (end < start) end += 24 * 60;
  return Math.round(((end - start) / 60) * 10) / 10;
}

function stars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.round(Math.abs(d2.getTime() - d1.getTime()) / 86400000);
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]!;
}

function StepsBarChart({
  data,
  accent,
  muted,
}: {
  data: { date: string; steps: number }[];
  accent: string;
  muted: string;
}) {
  const ordered = [...data].reverse();
  const max = Math.max(...ordered.map((d) => d.steps), 1);
  const today = getTodayString();
  const barW = 28;
  const gap = 8;
  const height = 72;
  const width = ordered.length * (barW + gap);

  return (
    <Svg width={width} height={height + 20}>
      {ordered.map((d, i) => {
        const barH = Math.max(4, (d.steps / max) * height);
        const x = i * (barW + gap);
        const isToday = d.date === today;
        return (
          <Rect
            key={d.date}
            x={x}
            y={height - barH}
            width={barW}
            height={barH}
            rx={4}
            fill={isToday ? accent : muted}
          />
        );
      })}
    </Svg>
  );
}

function BmiScale({ bmi }: { bmi: number }) {
  const clamped = Math.min(40, Math.max(15, bmi));
  const position = ((clamped - 15) / 25) * 100;

  return (
    <View style={bmiStyles.wrap}>
      <View style={bmiStyles.track}>
        <View style={[bmiStyles.segment, { backgroundColor: "#0ea5e933" }]} />
        <View style={[bmiStyles.segment, { backgroundColor: "#34d39933" }]} />
        <View style={[bmiStyles.segment, { backgroundColor: "#fbbf2433" }]} />
        <View style={[bmiStyles.segment, { backgroundColor: "#f8717133" }]} />
        <View style={[bmiStyles.marker, { left: `${position}%` }]}>
          <Text style={bmiStyles.markerText}>▼</Text>
        </View>
      </View>
      <View style={bmiStyles.labels}>
        <Text style={bmiStyles.label}>Under</Text>
        <Text style={bmiStyles.label}>Normal</Text>
        <Text style={bmiStyles.label}>Over</Text>
        <Text style={bmiStyles.label}>Obese</Text>
      </View>
    </View>
  );
}

const bmiStyles = StyleSheet.create({
  wrap: { marginTop: 10, gap: 6 },
  track: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  segment: { flex: 1 },
  marker: {
    position: "absolute",
    top: -10,
    marginLeft: -6,
  },
  markerText: { fontSize: 10, color: "#e2e8f0" },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: { fontSize: 9, color: "#6b7280" },
});

export default function HealthScreen() {
  const { theme } = useTheme();
  const { colors } = theme;
  const { celebrate } = useCelebrationContext();

  const profile = useAppStore((s) => s.profile);
  const sleepLog = useAppStore((s) => s.sleepLog);
  const todayWorkouts = useAppStore((s) => s.todayWorkouts);
  const bodyMetrics = useAppStore((s) => s.bodyMetrics);
  const logSleep = useAppStore((s) => s.logSleep);
  const addWorkout = useAppStore((s) => s.addWorkout);
  const logWeight = useAppStore((s) => s.logWeight);
  const updateSteps = useAppStore((s) => s.updateSteps);
  const appPreferences = useAppStore((s) => s.appPreferences);

  const {
    steps,
    goal: stepGoal,
    percentage: stepPct,
    isAvailable,
    isLoading: stepsLoading,
    isManual,
    error: stepsError,
    setManualSteps,
    clearManualOverride,
    getHistoricalSteps,
    retryStepCounter,
  } = useStepCounter();

  const [sheet, setSheet] = useState<SheetKind>(null);
  const [stepHistory, setStepHistory] = useState<{ date: string; steps: number }[]>([]);
  const [weekSleep, setWeekSleep] = useState<number[]>([]);
  const [weekWorkouts, setWeekWorkouts] = useState(0);
  const [weightTrend, setWeightTrend] = useState(0);

  const [manualStepsInput, setManualStepsInput] = useState("");
  const [bedTime, setBedTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepQuality, setSleepQuality] = useState<QualityRating>(4);

  const [exerciseType, setExerciseType] = useState<ExerciseType>("walk");
  const [workoutDuration, setWorkoutDuration] = useState("30");
  const [intensity, setIntensity] = useState<IntensityLevel>("moderate");

  const [weightUnit, setWeightUnit] = useState<"kg" | "lbs">(appPreferences.weightUnit);
  const [weightInput, setWeightInput] = useState("");

  const stepGoalHitRef = useRef(false);

  const sleepDuration = useMemo(
    () => sleepDurationHours(bedTime, wakeTime),
    [bedTime, wakeTime]
  );

  const workoutMinutes = Number(workoutDuration) || 0;
  const estimatedCalories = useMemo(
    () =>
      calculateCaloriesBurned(
        exerciseType,
        workoutMinutes,
        profile?.weightKg ?? 70,
        intensity
      ),
    [exerciseType, workoutMinutes, intensity, profile?.weightKg]
  );

  const loadWeekly = useCallback(async () => {
    const history = await getHistoricalSteps(7);
    setStepHistory(history);

    const sleepData = await storage.getSleepHistory(7);
    setWeekSleep(sleepData.map((s) => s.durationHours));

    const workouts = await storage.getWorkoutHistory(7);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString().split("T")[0]!;
    setWeekWorkouts(workouts.filter((w) => w.date >= weekStr).length);

    const metrics = await storage.getBodyMetrics(14);
    if (metrics.length >= 2) {
      const newest = metrics[0]!.weightKg;
      const oldest = metrics[metrics.length - 1]!.weightKg;
      setWeightTrend(Math.round((newest - oldest) * 10) / 10);
    }
  }, [getHistoricalSteps]);

  useEffect(() => {
    void loadWeekly();
  }, [loadWeekly, steps, sleepLog, todayWorkouts, bodyMetrics]);

  useEffect(() => {
    updateSteps(steps);
  }, [steps, updateSteps]);

  useEffect(() => {
    if (steps >= stepGoal && stepGoal > 0 && !stepGoalHitRef.current) {
      stepGoalHitRef.current = true;
      celebrate("steps_goal");
    }
    if (steps < stepGoal) {
      stepGoalHitRef.current = false;
    }
  }, [steps, stepGoal, celebrate]);

  const stepStats = useMemo(() => {
    const todaySteps = steps;
    const last7 = stepHistory.length ? stepHistory : [{ date: getTodayString(), steps: todaySteps }];
    const avg = Math.round(last7.reduce((s, d) => s + d.steps, 0) / last7.length);
    const best = Math.max(...last7.map((d) => d.steps), todaySteps);
    return { avg, best };
  }, [stepHistory, steps]);

  const latestWeight = bodyMetrics[0]?.weightKg ?? profile?.weightKg;
  const startWeight =
    bodyMetrics.length > 0
      ? bodyMetrics[bodyMetrics.length - 1]!.weightKg
      : profile?.weightKg ?? 0;
  const weightChange =
    latestWeight && startWeight
      ? Math.round((latestWeight - startWeight) * 10) / 10
      : 0;

  const bmiResult: BMIResult | null =
    profile && latestWeight
      ? calculateBMI(latestWeight, profile.heightCm)
      : null;

  const avgSleep =
    weekSleep.length > 0
      ? Math.round((weekSleep.reduce((a, b) => a + b, 0) / weekSleep.length) * 10) / 10
      : sleepLog?.durationHours ?? 0;

  const avgSteps = stepStats.avg;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.background },
        scroll: { paddingHorizontal: spacing.base, paddingBottom: 120 },
        header: { paddingTop: spacing.md, paddingBottom: spacing.lg, gap: 4 },
        title: { ...typography.h1, color: colors.textPrimary, fontSize: 28 },
        subtitle: { ...typography.body, color: colors.textSecondary, fontSize: 15 },
        sectionLabel: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: colors.textSecondary,
          marginBottom: spacing.sm,
          marginTop: spacing.lg,
        },
        card: {
          backgroundColor: colors.surface1,
          borderRadius: 14,
          padding: spacing.base,
          borderWidth: 1,
          borderColor: colors.border,
          gap: spacing.sm,
        },
        bigValue: {
          fontSize: 36,
          fontWeight: "700",
          color: colors.textPrimary,
          fontVariant: ["tabular-nums"],
        },
        meta: { fontSize: 14, color: colors.textSecondary },
        progressTrack: {
          height: 6,
          backgroundColor: colors.surface2,
          borderRadius: 3,
          overflow: "hidden",
        },
        progressFill: {
          height: "100%",
          backgroundColor: colors.accent,
          borderRadius: 3,
        },
        row: { flexDirection: "row", gap: spacing.sm },
        btn: {
          flex: 1,
          paddingVertical: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          backgroundColor: colors.surface2,
        },
        btnText: { fontSize: 13, fontWeight: "600", color: colors.textPrimary },
        statRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: spacing.sm,
        },
        statItem: { alignItems: "center", flex: 1 },
        statVal: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
        statLbl: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
        dotsRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: spacing.sm,
          paddingHorizontal: 4,
        },
        dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surface3 },
        dotActive: { backgroundColor: colors.accent },
        stars: { fontSize: 16, color: "#fbbf24", letterSpacing: 2 },
        workoutRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 6,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        workoutName: { fontSize: 15, color: colors.textPrimary, fontWeight: "600" },
        workoutMeta: { fontSize: 12, color: colors.textSecondary },
        bmiBadge: {
          alignSelf: "flex-start",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 99,
        },
        bmiBadgeText: { fontSize: 12, fontWeight: "700" },
        weightLine: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginVertical: spacing.sm,
        },
        weightPoint: { fontSize: 13, color: colors.textSecondary },
        weightArrow: { color: colors.textSecondary },
        summaryGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
        },
        summaryItem: {
          width: "47%",
          backgroundColor: colors.surface2,
          borderRadius: 10,
          padding: spacing.sm,
        },
        summaryVal: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },
        summaryLbl: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
        sheetForm: { gap: spacing.md },
        grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
        gridItem: {
          width: "23%",
          minWidth: 72,
          paddingVertical: 10,
          alignItems: "center",
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface2,
        },
        gridItemActive: { borderColor: colors.accent, backgroundColor: colors.surface3 },
        gridIcon: { fontSize: 22 },
        gridLabel: { fontSize: 10, color: colors.textPrimary, marginTop: 4 },
        kcal: { fontSize: 15, color: colors.accent, fontWeight: "600" },
      }),
    [colors]
  );

  const saveManualSteps = async () => {
    const val = parseInt(manualStepsInput, 10);
    if (Number.isNaN(val) || val < 0) return;
    await setManualSteps(val);
    setSheet(null);
    setManualStepsInput("");
    void loadWeekly();
  };

  const saveSleep = () => {
    logSleep({
      date: getTodayString(),
      bedTime,
      wakeTime,
      durationHours: sleepDuration,
      qualityRating: sleepQuality,
    });
    setSheet(null);
  };

  const saveWorkout = () => {
    if (workoutMinutes <= 0) return;
    addWorkout({
      date: getTodayString(),
      exerciseType,
      durationMinutes: workoutMinutes,
      intensityLevel: intensity,
      caloriesBurned: estimatedCalories,
    });
    setSheet(null);
  };

  const saveWeightEntry = () => {
    const parsed = Number(weightInput);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    const kg = weightUnit === "kg" ? parsed : parsed / 2.20462;
    logWeight(Math.round(kg * 10) / 10);
    setSheet(null);
    setWeightInput("");
  };

  const lastWeightLog = bodyMetrics[0];
  const lastWeightDaysAgo = lastWeightLog
    ? daysBetween(lastWeightLog.date, getTodayString())
    : null;

  const historyDots = useMemo(() => {
    const ordered = [...stepHistory].reverse();
    const max = Math.max(...ordered.map((d) => d.steps), 1);
    return ordered.map((d) => ({
      date: d.date,
      filled: d.steps / max >= 0.5,
    }));
  }, [stepHistory]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Health Hub</Text>
          <Text style={styles.subtitle}>Track your body every day</Text>
        </View>

        {/* STEPS */}
        <Text style={styles.sectionLabel}>Steps</Text>
        <View style={styles.card}>
          {stepsLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
          ) : stepsError ? (
            <>
              <Text style={[styles.meta, { color: "#fbbf24", lineHeight: 20 }]}>
                ⚠️ {stepsError}
              </Text>
              <View style={[styles.row, { marginTop: spacing.sm }]}>
                <TouchableOpacity
                  style={[styles.btn, { flex: 1 }]}
                  onPress={() => void Linking.openSettings()}
                >
                  <Text style={styles.btnText}>Open Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, { flex: 1 }]}
                  onPress={() => void retryStepCounter()}
                >
                  <Text style={styles.btnText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.bigValue}>{steps.toLocaleString()}</Text>
              <Text style={styles.meta}>
                /{stepGoal.toLocaleString()} steps · {stepPct}%
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(100, stepPct)}%` }]} />
              </View>

              {isManual ? (
                <>
                  <Text style={styles.meta}>Manually entered today</Text>
                  <TouchableOpacity
                    style={[styles.btn, { marginTop: spacing.xs }]}
                    onPress={() => void clearManualOverride()}
                  >
                    <Text style={styles.btnText}>Switch to phone counter</Text>
                  </TouchableOpacity>
                </>
              ) : isAvailable ? (
                <Text style={[styles.meta, { fontSize: 12, color: "#6b7280" }]}>
                  Synced with your phone&apos;s step counter
                </Text>
              ) : null}

              <TouchableOpacity
                style={{ marginTop: spacing.sm }}
                onPress={() => {
                  if (isManual) {
                    void clearManualOverride();
                  } else {
                    setManualStepsInput(String(steps));
                    setSheet("steps");
                  }
                }}
              >
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  {isManual ? "↩ Switch to auto-count" : "✏️ Enter manually"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {!stepsLoading && !stepsError ? (
            <>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{steps.toLocaleString()}</Text>
                  <Text style={styles.statLbl}>Today</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{stepStats.avg.toLocaleString()}</Text>
                  <Text style={styles.statLbl}>Avg 7 days</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statVal}>{stepStats.best.toLocaleString()}</Text>
                  <Text style={styles.statLbl}>Best day</Text>
                </View>
              </View>
              {historyDots.length > 0 ? (
                <View style={styles.dotsRow}>
                  {historyDots.map((d) => (
                    <View
                      key={d.date}
                      style={[styles.dot, d.filled && styles.dotActive]}
                    />
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </View>

        {/* SLEEP */}
        <Text style={styles.sectionLabel}>Sleep</Text>
        <View style={styles.card}>
          {sleepLog ? (
            <>
              <Text style={styles.bigValue}>{formatSleep(sleepLog.durationHours)}</Text>
              <Text style={styles.meta}>
                Slept {formatTime12(sleepLog.bedTime)} → {formatTime12(sleepLog.wakeTime)}
              </Text>
              <Text style={styles.stars}>{stars(sleepLog.qualityRating)}</Text>
              <Button
                label="+ Log Sleep"
                variant="secondary"
                size="sm"
                onPress={() => setSheet("sleep")}
              />
            </>
          ) : (
            <>
              <Text style={styles.meta}>Log last night&apos;s sleep</Text>
              <Button label="+ Log Sleep" onPress={() => setSheet("sleep")} size="sm" />
            </>
          )}
        </View>

        {/* WORKOUT */}
        <Text style={styles.sectionLabel}>Workout</Text>
        <View style={styles.card}>
          {todayWorkouts.length > 0 ? (
            <>
              {todayWorkouts.map((w) => (
                <View key={w.id} style={styles.workoutRow}>
                  <View>
                    <Text style={styles.workoutName}>
                      {EXERCISE_LABELS[w.exerciseType]}
                    </Text>
                    <Text style={styles.workoutMeta}>
                      {w.durationMinutes} min · {w.caloriesBurned} kcal
                    </Text>
                  </View>
                </View>
              ))}
              <Button
                label="+ Add another"
                variant="secondary"
                size="sm"
                onPress={() => setSheet("workout")}
              />
            </>
          ) : (
            <>
              <Text style={styles.meta}>No workout logged</Text>
              <Button label="+ Log Workout" onPress={() => setSheet("workout")} size="sm" />
            </>
          )}
        </View>

        {/* BODY WEIGHT */}
        <Text style={styles.sectionLabel}>Body Weight</Text>
        <View style={styles.card}>
          {latestWeight ? (
            <>
              <Text style={styles.bigValue}>
                {weightUnit === "kg"
                  ? `${latestWeight} kg`
                  : `${Math.round(latestWeight * 2.20462 * 10) / 10} lbs`}
              </Text>
              {weightChange !== 0 ? (
                <Text
                  style={[
                    styles.meta,
                    { color: weightChange < 0 ? "#34d399" : colors.textSecondary },
                  ]}
                >
                  {weightChange > 0 ? "+" : ""}
                  {weightChange} kg from start
                </Text>
              ) : null}
              {profile ? (
                <View style={styles.weightLine}>
                  <Text style={styles.weightPoint}>
                    {Math.round(startWeight * 10) / 10} kg
                  </Text>
                  <Text style={styles.weightArrow}>→</Text>
                  <Text style={[styles.weightPoint, { color: colors.accent }]}>
                    {Math.round(latestWeight * 10) / 10} kg
                  </Text>
                  <Text style={styles.weightArrow}>→</Text>
                  <Text style={styles.weightPoint}>
                    {Math.round(profile.goalWeightKg * 10) / 10} kg
                  </Text>
                </View>
              ) : null}
              <Button
                label="+ Log Today's Weight"
                variant="secondary"
                size="sm"
                onPress={() => setSheet("weight")}
              />
            </>
          ) : (
            <>
              <Text style={styles.meta}>
                Goal: {profile?.goalWeightKg ?? "—"} kg
              </Text>
              <Button label="Log your weight" onPress={() => setSheet("weight")} size="sm" />
            </>
          )}
        </View>

        {/* BMI */}
        {bmiResult ? (
          <>
            <Text style={styles.sectionLabel}>BMI</Text>
            <View style={styles.card}>
              <Text style={styles.bigValue}>{bmiResult.bmi}</Text>
              <View
                style={[
                  styles.bmiBadge,
                  { backgroundColor: `${BMI_COLORS[bmiResult.category]}22` },
                ]}
              >
                <Text
                  style={[styles.bmiBadgeText, { color: BMI_COLORS[bmiResult.category] }]}
                >
                  {BMI_LABELS[bmiResult.category]}
                </Text>
              </View>
              <BmiScale bmi={bmiResult.bmi} />
            </View>
          </>
        ) : null}

        {/* WEEKLY SUMMARY */}
        <Text style={styles.sectionLabel}>This week</Text>
        <View style={styles.card}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>{avgSteps.toLocaleString()}</Text>
              <Text style={styles.summaryLbl}>Avg steps</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>{formatSleep(avgSleep)}</Text>
              <Text style={styles.summaryLbl}>Avg sleep</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryVal}>{weekWorkouts}</Text>
              <Text style={styles.summaryLbl}>Workouts</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[
                  styles.summaryVal,
                  {
                    color:
                      weightTrend < 0 ? "#34d399" : weightTrend > 0 ? "#fbbf24" : colors.textPrimary,
                  },
                ]}
              >
                {weightTrend > 0 ? "+" : ""}
                {weightTrend} kg
              </Text>
              <Text style={styles.summaryLbl}>Weight trend</Text>
            </View>
          </View>
          {stepHistory.length > 0 ? (
            <View style={{ marginTop: spacing.md, alignItems: "center" }}>
              <StepsBarChart
                data={stepHistory}
                accent={colors.accent}
                muted={colors.surface3}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>

      <BottomSheet
        visible={sheet === "steps"}
        onClose={() => setSheet(null)}
        title="How many steps today?"
      >
        <View style={styles.sheetForm}>
          <TextInput
            value={manualStepsInput}
            onChangeText={setManualStepsInput}
            keyboardType="number-pad"
            placeholder="8000"
            placeholderTextColor={colors.textSecondary}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              color: colors.textPrimary,
              fontSize: 18,
              backgroundColor: colors.surface2,
            }}
          />
          <Button label="Save" onPress={() => void saveManualSteps()} />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={sheet === "sleep"}
        onClose={() => setSheet(null)}
        title="Log Sleep"
        height="full"
      >
        <ScrollView contentContainerStyle={styles.sheetForm} keyboardShouldPersistTaps="handled">
          <TimePickerField label="Bed time" value={bedTime} onChange={setBedTime} />
          <TimePickerField label="Wake time" value={wakeTime} onChange={setWakeTime} />
          <Text style={[styles.meta, { fontSize: 16, fontWeight: "600" }]}>
            {formatSleep(sleepDuration)}
          </Text>
          <MoodSelector
            label="Sleep quality"
            value={sleepQuality}
            onChange={(r) => setSleepQuality(r as QualityRating)}
          />
          <Button label="Save Sleep Log" onPress={saveSleep} />
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={sheet === "workout"}
        onClose={() => setSheet(null)}
        title="Log Workout"
        height="full"
      >
        <ScrollView contentContainerStyle={styles.sheetForm} keyboardShouldPersistTaps="handled">
          <View style={styles.grid}>
            {EXERCISES.map((ex) => (
              <Pressable
                key={ex.type}
                style={[styles.gridItem, exerciseType === ex.type && styles.gridItemActive]}
                onPress={() => setExerciseType(ex.type)}
              >
                <Text style={styles.gridIcon}>{ex.icon}</Text>
                <Text style={styles.gridLabel}>{ex.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.meta}>Duration (minutes)</Text>
          <TextInput
            value={workoutDuration}
            onChangeText={setWorkoutDuration}
            keyboardType="number-pad"
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              color: colors.textPrimary,
              backgroundColor: colors.surface2,
            }}
          />
          <Text style={styles.meta}>Intensity</Text>
          <SegmentedControl
            options={["Light", "Moderate", "Intense"]}
            selected={
              intensity === "light"
                ? "Light"
                : intensity === "intense"
                  ? "Intense"
                  : "Moderate"
            }
            onChange={(label) => {
              setIntensity(
                label === "Light" ? "light" : label === "Intense" ? "intense" : "moderate"
              );
            }}
          />
          <Text style={styles.kcal}>Estimated burn: {estimatedCalories} kcal</Text>
          <Button label="Save Workout" onPress={saveWorkout} />
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={sheet === "weight"}
        onClose={() => setSheet(null)}
        title="Log Weight"
      >
        <View style={styles.sheetForm}>
          <SegmentedControl
            options={["kg", "lbs"]}
            selected={weightUnit}
            onChange={(u) => setWeightUnit(u as "kg" | "lbs")}
          />
          {lastWeightLog ? (
            <Text style={styles.meta}>
              Last logged:{" "}
              {lastWeightDaysAgo === 0
                ? "today"
                : `${lastWeightDaysAgo} day${lastWeightDaysAgo === 1 ? "" : "s"} ago`}{" "}
              · {lastWeightLog.weightKg} kg
            </Text>
          ) : null}
          <TextInput
            value={weightInput}
            onChangeText={setWeightInput}
            keyboardType="decimal-pad"
            placeholder={`Weight (${weightUnit})`}
            placeholderTextColor={colors.textSecondary}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 14,
              color: colors.textPrimary,
              backgroundColor: colors.surface2,
            }}
          />
          <Button label="Save Weight" onPress={saveWeightEntry} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
