import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { router, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StepsCard from "../../components/health/StepsCard";
import { useCelebrationContext } from "../../components/providers/CelebrationProvider";
import {
  AnimatedCard,
  CountUpNumber,
  HabitCheckbox,
  PulsingFire,
} from "../../components/ui/MicroAnimations";
import { RingProgress } from "../../components/ui/RingProgress";
import { useTheme } from "../../context/ThemeContext";
import { useAI } from "../../hooks/useAI";
import { useStepCounter } from "../../hooks/useStepCounter";
import { useAppStore } from "../../store/useAppStore";
import { isAIConfigured } from "../../utils/ai";
import { APP_NAME } from "../../utils/appBrand";
import { getCardStyle } from "../../utils/cardStyles";
import { radii, spacing } from "../../utils/designTokens";
import { getTodayString } from "../../utils/date";
import { inferMealType, navigateToAddMeal } from "../../utils/foodNavigation";
import { getCurrentStreak } from "../../utils/habitStreak";
import {
  getInitials,
  getPersonalizedGreeting,
  getScoreMoodLabel,
  getStoredMorningMission,
  isMorningRitualDoneToday,
} from "../../utils/morningRitual";
import { typography } from "../../utils/typography";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MISSION_DISMISS_KEY = "dayos:mission_dismissed";

function formatSleep(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function areaIcon(done: boolean): string {
  return done ? "✅" : "⬜";
}

interface MetricCardProps {
  icon: string;
  primary: string;
  label: string;
  subtext: string;
  onPress: () => void;
  progress?: number;
  colors: ReturnType<typeof useTheme>["theme"]["colors"];
}

function MetricCard({
  icon,
  primary,
  label,
  subtext,
  onPress,
  progress = 0,
  colors,
}: MetricCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        metricStyles.card,
        { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}
    >
      <View style={metricStyles.topRow}>
        <Text style={metricStyles.icon}>{icon}</Text>
      </View>
      <Text style={[metricStyles.primary, { color: colors.textPrimary }]}>{primary}</Text>
      <Text style={[metricStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[metricStyles.subtext, { color: colors.textSecondary }]}>{subtext}</Text>
      <View style={[metricStyles.barTrack, { backgroundColor: colors.surface3 }]}>
        <View
          style={[
            metricStyles.barFill,
            {
              width: `${Math.min(100, Math.max(0, progress))}%`,
              backgroundColor: colors.accent,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const metricStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radii.lg,
    padding: spacing.base,
    borderWidth: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  icon: { fontSize: 18 },
  primary: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  subtext: {
    fontSize: 11,
    lineHeight: 16,
    minHeight: 32,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 2,
  },
});

export default function HomeScreen() {
  const { theme, spacing: sp } = useTheme();
  const { colors } = theme;
  const { celebrate } = useCelebrationContext();
  const { getMorningNudge } = useAI();
  const {
    steps,
    goal: stepGoal,
    percentage: stepPercentage,
    isAvailable,
    isLoading: stepsLoading,
    isManual,
    clearManualOverride,
  } = useStepCounter();
  const updateSteps = useAppStore((s) => s.updateSteps);

  const profile = useAppStore((s) => s.profile);
  const aiConfig = useAppStore((s) => s.aiConfig);
  const dayScore = useAppStore((s) => s.dayScore);
  const todayFoodLog = useAppStore((s) => s.todayFoodLog);
  const waterLog = useAppStore((s) => s.waterLog);
  const waterConfig = useAppStore((s) => s.waterConfig);
  const habits = useAppStore((s) => s.habits);
  const habitLogs = useAppStore((s) => s.habitLogs);
  const sleepLog = useAppStore((s) => s.sleepLog);
  const toggleHabit = useAppStore((s) => s.toggleHabit);
  const logWaterMl = useAppStore((s) => s.logWaterMl);

  const [mission, setMission] = useState<string | null>(null);
  const [missionVisible, setMissionVisible] = useState(false);
  const [nudgeExpanded, setNudgeExpanded] = useState(false);
  const [nudgeText, setNudgeText] = useState("");
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const prevHabitsDone = useRef(0);

  const name = profile?.name ?? "there";
  const today = getTodayString();
  const score = Math.round(dayScore.overall);

  const activeHabits = useMemo(
    () => habits.filter((h) => h.isActive),
    [habits]
  );

  const habitsDone = useMemo(
    () =>
      activeHabits.filter((habit) =>
        habitLogs.some(
          (log) =>
            log.habitId === habit.id &&
            log.date === today &&
            log.isCompleted
        )
      ).length,
    [activeHabits, habitLogs, today]
  );

  const bestStreak = useMemo(() => {
    if (activeHabits.length === 0) return 0;
    return Math.max(...activeHabits.map((h) => getCurrentStreak(h.id, habitLogs)));
  }, [activeHabits, habitLogs]);

  const calorieGoal = profile?.dailyCalorieGoal ?? 2000;
  const calories = todayFoodLog.totalCalories;
  const caloriePct = calorieGoal > 0 ? Math.round((calories / calorieGoal) * 100) : 0;

  const bottlesConsumed = waterLog?.bottleCount ?? 0;
  const goalBottles = waterConfig.dailyGoalBottles;
  const waterPct =
    goalBottles > 0 ? Math.round((bottlesConsumed / goalBottles) * 100) : 0;

  const sleepText = sleepLog ? formatSleep(sleepLog.durationHours) : "—";

  const pendingHabits = useMemo(
    () =>
      activeHabits.filter(
        (h) =>
          !habitLogs.some(
            (l) => l.habitId === h.id && l.date === today && l.isCompleted
          )
      ),
    [activeHabits, habitLogs, today]
  );

  const greeting = getPersonalizedGreeting({
    name,
    streak: bestStreak,
    score,
    calories,
    calorieGoal,
    waterLogged: bottlesConsumed > 0,
  });

  const caloriesDone = caloriePct >= 80;
  const waterDone = waterPct >= 80;
  const healthDone = steps >= stepGoal && stepGoal > 0;
  const habitsDoneFlag =
    activeHabits.length > 0 && habitsDone === activeHabits.length;

  useEffect(() => {
    updateSteps(steps);
  }, [steps, updateSteps]);

  useEffect(() => {
    void (async () => {
      const ritualDone = await isMorningRitualDoneToday();
      if (!ritualDone) return;
      const dismissed = await AsyncStorage.getItem(MISSION_DISMISS_KEY);
      if (dismissed === today) return;
      const stored = await getStoredMorningMission();
      if (stored) {
        setMission(stored);
        setMissionVisible(true);
      }
    })();
  }, [today]);

  useEffect(() => {
    if (
      activeHabits.length > 0 &&
      habitsDone === activeHabits.length &&
      prevHabitsDone.current < activeHabits.length
    ) {
      celebrate("habits_complete");
    }
    prevHabitsDone.current = habitsDone;
  }, [activeHabits.length, celebrate, habitsDone]);

  const loadNudge = useCallback(async () => {
    if (!isAIConfigured(aiConfig)) return;
    setNudgeLoading(true);
    try {
      const text = await getMorningNudge();
      setNudgeText(text);
    } finally {
      setNudgeLoading(false);
    }
  }, [aiConfig, getMorningNudge]);

  useEffect(() => {
    void loadNudge();
  }, [loadNudge]);

  const dismissMission = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMissionVisible(false);
    await AsyncStorage.setItem(MISSION_DISMISS_KEY, today);
  };

  const quickLogWater = () => {
    logWaterMl(waterConfig.bottleSizeMl);
    if (bottlesConsumed + 1 >= goalBottles) {
      celebrate("water_goal");
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.background },
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: sp.base,
          paddingTop: sp.md,
          paddingBottom: sp.sm,
          gap: sp.md,
        },
        headerCopy: { flex: 1, gap: 2 },
        headerTitle: {
          ...typography.h2,
          color: colors.textPrimary,
        },
        headerSub: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        headerRight: {
          flexDirection: "row",
          alignItems: "center",
          gap: sp.sm,
        },
        avatar: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
        },
        avatarText: {
          color: "#ffffff",
          fontWeight: "800",
          fontSize: 15,
        },
        scroll: { flex: 1 },
        content: {
          paddingHorizontal: sp.base,
          paddingBottom: 120,
          gap: sp.lg,
        },
        heroCard: {
          ...getCardStyle(theme),
          flexDirection: "row",
          alignItems: "center",
          padding: 20,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: `${colors.accent}33`,
        },
        heroLeft: { flex: 0.6, gap: 4 },
        heroScore: {
          fontSize: 64,
          fontWeight: "800",
          color: colors.accent,
          lineHeight: 68,
        },
        heroLabel: {
          fontSize: 12,
          color: colors.textSecondary,
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: 0.6,
        },
        heroMood: {
          ...typography.body,
          color: colors.textPrimary,
          marginTop: 4,
        },
        heroRight: {
          flex: 0.4,
          alignItems: "center",
          gap: 8,
        },
        areaDots: {
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 4,
          maxWidth: 120,
        },
        areaDotLine: {
          fontSize: 11,
          color: colors.textSecondary,
          textAlign: "center",
        },
        missionCard: {
          backgroundColor: colors.surface1,
          borderRadius: radii.lg,
          padding: 16,
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
          flexDirection: "row",
          gap: 8,
        },
        missionBody: { flex: 1, gap: 4 },
        missionTitle: {
          fontSize: 11,
          fontWeight: "700",
          color: colors.accent,
          letterSpacing: 0.6,
        },
        missionText: {
          fontSize: 14,
          color: colors.textPrimary,
          lineHeight: 20,
        },
        missionClose: {
          color: colors.textSecondary,
          fontSize: 18,
          padding: 4,
        },
        quickRow: {
          flexDirection: "row",
          gap: sp.sm,
        },
        quickBtn: {
          flex: 1,
          backgroundColor: colors.surface2,
          borderRadius: radii.pill,
          paddingVertical: 12,
          paddingHorizontal: 8,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
        },
        quickBtnText: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        statsRow: {
          flexDirection: "row",
          gap: sp.md,
        },
        habitsSection: { gap: sp.sm },
        habitsHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        habitsTitle: {
          ...typography.h3,
          color: colors.textPrimary,
        },
        seeAll: {
          color: colors.accent,
          fontWeight: "600",
          fontSize: 14,
        },
        habitsCard: {
          ...getCardStyle(theme),
          padding: sp.base,
          gap: sp.sm,
        },
        habitsDoneCard: {
          backgroundColor: "rgba(52,211,153,0.15)",
          borderColor: "rgba(52,211,153,0.35)",
          borderWidth: 1,
          borderRadius: radii.lg,
          padding: sp.base,
          alignItems: "center",
        },
        habitsDoneText: {
          color: colors.success,
          fontWeight: "700",
          fontSize: 16,
        },
        habitRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: sp.md,
          paddingVertical: sp.xs,
        },
        habitName: {
          ...typography.body,
          color: colors.textPrimary,
          flex: 1,
        },
        nudgeCard: {
          ...getCardStyle(theme),
          padding: sp.base,
          gap: sp.sm,
        },
        nudgeHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        nudgeTitle: {
          fontWeight: "700",
          color: colors.textPrimary,
        },
        nudgeRefresh: {
          color: colors.accent,
          fontWeight: "600",
        },
        nudgePreview: {
          color: colors.textSecondary,
          fontSize: 13,
        },
        nudgeBody: {
          color: colors.textPrimary,
          lineHeight: 20,
        },
      }),
    [colors, sp, theme]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{greeting.headline}</Text>
          {greeting.subline ? (
            <Text style={styles.headerSub}>{greeting.subline}</Text>
          ) : null}
        </View>
        <View style={styles.headerRight}>
          {bestStreak > 0 ? <PulsingFire count={bestStreak} size={18} /> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => router.push("/(tabs)/settings")}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{getInitials(name)}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedCard delay={0}>
          <View style={styles.heroCard}>
            <View style={styles.heroLeft}>
              <CountUpNumber value={score} style={styles.heroScore} />
              <Text style={styles.heroLabel}>today's score</Text>
              <Text style={styles.heroMood}>{getScoreMoodLabel(score)}</Text>
            </View>
            <View style={styles.heroRight}>
              <RingProgress size={60} progress={score / 100} strokeWidth={6} />
              <View style={styles.areaDots}>
                <Text style={styles.areaDotLine}>
                  🔥 {areaIcon(caloriesDone)} 💧 {areaIcon(waterDone)}
                </Text>
                <Text style={styles.areaDotLine}>
                  🫀 {areaIcon(healthDone)} ✅ {areaIcon(habitsDoneFlag)}
                </Text>
              </View>
            </View>
          </View>
        </AnimatedCard>

        {missionVisible && mission ? (
          <View style={styles.missionCard}>
            <View style={styles.missionBody}>
              <Text style={styles.missionTitle}>TODAY'S MISSION</Text>
              <Text style={styles.missionText}>{mission}</Text>
            </View>
            <Pressable onPress={() => void dismissMission()}>
              <Text style={styles.missionClose}>✕</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.quickRow}>
          <Pressable
            style={styles.quickBtn}
            onPress={() => navigateToAddMeal(inferMealType())}
          >
            <Text style={styles.quickBtnText}>🍛 Log meal</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={quickLogWater}>
            <Text style={styles.quickBtnText}>💧 +Water</Text>
          </Pressable>
          <Pressable
            style={styles.quickBtn}
            onPress={() => router.push("/(tabs)/habits")}
          >
            <Text style={styles.quickBtnText}>✅ Task</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <AnimatedCard delay={0} style={{ flex: 1 }}>
            <MetricCard
              icon="🔥"
              primary={
                calories === 0
                  ? calorieGoal.toLocaleString()
                  : calories.toLocaleString()
              }
              label={calories === 0 ? "kcal goal today" : "kcal logged"}
              subtext={
                calories === 0
                  ? "Nothing logged yet — log breakfast"
                  : `${caloriePct}% of goal`
              }
              progress={caloriePct}
              onPress={() => router.push("/(tabs)/food")}
              colors={colors}
            />
          </AnimatedCard>
          <AnimatedCard delay={80} style={{ flex: 1 }}>
            <MetricCard
              icon="💧"
              primary={bottlesConsumed === 0 ? String(goalBottles) : String(bottlesConsumed)}
              label={bottlesConsumed === 0 ? "bottles to drink" : "bottles logged"}
              subtext={
                bottlesConsumed === 0
                  ? "Start with one now 💧"
                  : `${waterPct}% of goal`
              }
              progress={waterPct}
              onPress={() => router.push("/(tabs)/water")}
              colors={colors}
            />
          </AnimatedCard>
        </View>

        <View style={styles.statsRow}>
          <AnimatedCard delay={160} style={{ flex: 1 }}>
            <StepsCard
              steps={steps}
              goal={stepGoal}
              percentage={stepPercentage}
              isAvailable={isAvailable}
              isLoading={stepsLoading}
              isManual={isManual}
              onManualEntry={() => {
                if (isManual) {
                  void clearManualOverride();
                } else {
                  router.push("/(tabs)/health" as Href);
                }
              }}
              onPress={() => router.push("/(tabs)/health" as Href)}
            />
          </AnimatedCard>
          <AnimatedCard delay={240} style={{ flex: 1 }}>
            <MetricCard
              icon="😴"
              primary={sleepLog ? sleepText : "—"}
              label="sleep"
              subtext={sleepLog ? "Logged last night" : "Log last night's sleep 😴"}
              progress={sleepLog ? 100 : 0}
              onPress={() => router.push("/(tabs)/health" as Href)}
              colors={colors}
            />
          </AnimatedCard>
        </View>

        <View style={styles.habitsSection}>
          <View style={styles.habitsHeader}>
            <Text style={styles.habitsTitle}>
              Habits: {habitsDone}/{activeHabits.length || 0} done
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/habits")}>
              <Text style={styles.seeAll}>See all →</Text>
            </Pressable>
          </View>

          {habitsDoneFlag ? (
            <View style={styles.habitsDoneCard}>
              <Text style={styles.habitsDoneText}>All habits done today! 🎯</Text>
            </View>
          ) : (
            <View style={styles.habitsCard}>
              {pendingHabits.length === 0 ? (
                <Text style={styles.headerSub}>No habits yet. Add some in Habits.</Text>
              ) : (
                pendingHabits.slice(0, 3).map((habit) => (
                  <View key={habit.id} style={styles.habitRow}>
                    <HabitCheckbox
                      checked={false}
                      onToggle={() => toggleHabit(habit.id)}
                      accentColor={habit.color}
                    />
                    <Text style={styles.habitName}>{habit.name}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {isAIConfigured(aiConfig) ? (
          <Pressable
            style={styles.nudgeCard}
            onPress={() => setNudgeExpanded((v) => !v)}
          >
            <View style={styles.nudgeHeader}>
              <Text style={styles.nudgeTitle}>{APP_NAME} says</Text>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  void loadNudge();
                }}
              >
                <Text style={styles.nudgeRefresh}>↻</Text>
              </Pressable>
            </View>
            {nudgeExpanded ? (
              <Text style={styles.nudgeBody}>
                {nudgeLoading ? "Thinking..." : nudgeText || "Tap to load your nudge."}
              </Text>
            ) : (
              <Text style={styles.nudgePreview} numberOfLines={1}>
                {nudgeLoading
                  ? "Loading..."
                  : nudgeText || "Tap to expand your morning nudge"}
              </Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
