import { format } from "date-fns";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../../context/ThemeContext";
import { Badge } from "../../components/ui/Badge";
import { FocusSessionCard } from "../../components/ui/FocusSessionCard";
import { RingProgress } from "../../components/ui/RingProgress";
import { StatCard } from "../../components/ui/StatCard";
import { getCardStyle } from "../../utils/cardStyles";
import { radii, spacing } from "../../utils/designTokens";
import { getGreeting, getTodayString } from "../../utils/date";
import { typography } from "../../utils/typography";
import { useAppStore } from "../../store/useAppStore";

function scoreHeadline(score: number): string {
  if (score >= 80) return "You're on track";
  if (score >= 60) return "Good momentum";
  if (score >= 40) return "Room to grow";
  return "Fresh start today";
}

function scoreBody(score: number): string {
  if (score >= 80) {
    return "4 of 6 rings closed. A short walk tonight gets you to gold.";
  }
  if (score >= 60) {
    return "Keep logging meals and water — small wins add up fast.";
  }
  return "Log breakfast, water, and one habit to build your score.";
}

function formatSleep(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function HomeScreen() {
  const { theme, spacing: sp } = useTheme();
  const { colors } = theme;

  const profile = useAppStore((s) => s.profile);
  const dayScore = useAppStore((s) => s.dayScore);
  const todayFoodLog = useAppStore((s) => s.todayFoodLog);
  const waterLog = useAppStore((s) => s.waterLog);
  const waterConfig = useAppStore((s) => s.waterConfig);
  const habits = useAppStore((s) => s.habits);
  const habitLogs = useAppStore((s) => s.habitLogs);
  const sleepLog = useAppStore((s) => s.sleepLog);
  const stepLog = useAppStore((s) => s.stepLog);
  const appPreferences = useAppStore((s) => s.appPreferences);
  const focusSessions = useAppStore((s) => s.focusSessions);
  const toggleHabit = useAppStore((s) => s.toggleHabit);

  const name = profile?.name ?? "there";
  const today = getTodayString();
  const todayLabel = format(new Date(), "EEEE, MMM d");
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

  const calorieGoal = profile?.dailyCalorieGoal ?? 2000;
  const calories = todayFoodLog.totalCalories;
  const caloriePct = calorieGoal > 0 ? Math.round((calories / calorieGoal) * 100) : 0;

  const waterLiters = ((waterLog?.totalMl ?? 0) / 1000).toFixed(1);
  const waterGoalLiters = (
    (waterConfig.dailyGoalBottles * waterConfig.bottleSizeMl) /
    1000
  ).toFixed(1);
  const waterPct =
    Number(waterGoalLiters) > 0
      ? Math.round((Number(waterLiters) / Number(waterGoalLiters)) * 100)
      : 0;

  const steps = stepLog?.steps ?? 0;
  const stepGoal = stepLog?.goalSteps ?? appPreferences.stepGoal;
  const stepsPct = stepGoal > 0 ? Math.round((steps / stepGoal) * 100) : 0;

  const sleepText = sleepLog ? formatSleep(sleepLog.durationHours) : "—";

  const todayFocusSessions = focusSessions.filter(
    (s) => s.startTime.slice(0, 10) === today && s.type === "work"
  );
  const completedFocus = todayFocusSessions.filter((s) => s.isCompleted).length;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scroll: { flex: 1 },
        content: {
          paddingHorizontal: sp.base,
          paddingTop: sp.md,
          paddingBottom: sp.xxxl,
          gap: sp.lg,
        },
        date: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        greeting: {
          ...typography.h1,
          color: colors.textPrimary,
        },
        scoreCard: {
          ...getCardStyle(theme),
          flexDirection: "row",
          alignItems: "center",
          gap: sp.lg,
          padding: 20,
        },
        scoreCopy: {
          flex: 1,
          gap: sp.sm,
        },
        scoreTitle: {
          ...typography.h3,
          color: colors.textPrimary,
        },
        scoreBody: {
          ...typography.body,
          color: colors.textSecondary,
          lineHeight: 22,
        },
        statsGrid: {
          gap: sp.md,
        },
        statsRow: {
          flexDirection: "row",
          gap: sp.md,
        },
        habitsHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        habitsTitle: {
          ...typography.h2,
          color: colors.textPrimary,
        },
        habitsCard: {
          ...getCardStyle(theme),
          padding: sp.base,
          gap: sp.sm,
        },
        habitRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: sp.md,
          paddingVertical: sp.sm,
        },
        checkbox: {
          width: 22,
          height: 22,
          borderRadius: radii.sm,
          borderWidth: 2,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        checkboxChecked: {
          borderColor: colors.accent,
          backgroundColor: colors.accent,
        },
        checkMark: {
          color: "#ffffff",
          fontWeight: "800",
          fontSize: 12,
        },
        habitName: {
          ...typography.body,
          color: colors.textPrimary,
          flex: 1,
        },
        habitDone: {
          textDecorationLine: "line-through",
          color: colors.textSecondary,
        },
        settingsLink: {
          alignSelf: "flex-end",
        },
        settingsText: {
          color: colors.accent,
          fontWeight: "600",
        },
      }),
    [colors, theme, sp]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text style={styles.date}>{todayLabel.toUpperCase()}</Text>
          <Text style={styles.greeting}>{getGreeting(name)}</Text>
        </View>

        <View style={styles.scoreCard}>
          <RingProgress
            variant="calorie"
            progress={score / 100}
            centerValue={String(score)}
            centerLabel="day score"
          />
          <View style={styles.scoreCopy}>
            <Text style={styles.scoreTitle}>{scoreHeadline(score)}</Text>
            <Text style={styles.scoreBody}>{scoreBody(score)}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              icon="🔥"
              label="Calories"
              value={calories.toLocaleString()}
              change={{
                value: caloriePct >= 100 ? `${caloriePct}%` : `+${Math.min(caloriePct, 99)}%`,
                trend: caloriePct >= 100 ? "down" : "up",
              }}
            />
            <StatCard
              icon="💧"
              label="Water"
              value={waterLiters}
              valueSuffix="L"
              change={{ value: `${waterPct}%`, trend: "neutral" }}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="👟"
              label="Steps"
              value={steps.toLocaleString()}
              change={{
                value: `+${Math.min(stepsPct, 99)}%`,
                trend: stepsPct > 0 ? "up" : "neutral",
              }}
            />
            <StatCard
              icon="😴"
              label="Sleep"
              value={sleepText}
              change={{ value: sleepLog ? "-4%" : "0%", trend: sleepLog ? "down" : "neutral" }}
            />
          </View>
        </View>

        {completedFocus < 4 ? (
          <Pressable onPress={() => router.push("/(tabs)/focus")}>
            <FocusSessionCard
              time="24:59"
              subtitle={`Deep work · ${completedFocus + 1} of 4`}
            />
          </Pressable>
        ) : null}

        <View>
          <View style={styles.habitsHeader}>
            <Text style={styles.habitsTitle}>Habits</Text>
            <Badge
              label={`${habitsDone}/${activeHabits.length || 0}`}
              variant="accent"
            />
          </View>

          <View style={styles.habitsCard}>
            {activeHabits.length === 0 ? (
              <Text style={styles.scoreBody}>No habits yet. Add some in Habits.</Text>
            ) : (
              activeHabits.slice(0, 4).map((habit) => {
                const done = habitLogs.some(
                  (log) =>
                    log.habitId === habit.id &&
                    log.date === today &&
                    log.isCompleted
                );
                return (
                  <Pressable
                    key={habit.id}
                    style={styles.habitRow}
                    onPress={() => toggleHabit(habit.id)}
                  >
                    <View style={[styles.checkbox, done && styles.checkboxChecked]}>
                      {done ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                    <Text style={[styles.habitName, done && styles.habitDone]}>
                      {habit.name}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        <Pressable
          style={styles.settingsLink}
          onPress={() => router.push("/(tabs)/settings")}
        >
          <Text style={styles.settingsText}>Settings →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
