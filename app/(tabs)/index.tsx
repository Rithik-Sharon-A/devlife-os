import { format, subDays } from "date-fns";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AICard } from "../../components/ai/AICard";
import { MorningBriefingModal } from "../../components/MorningBriefingModal";
import { FoodSearchBar } from "../../components/food/FoodSearchBar";
import { BottleDisplay } from "../../components/water/BottleDisplay";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { MoodSelector } from "../../components/ui/MoodSelector";
import { ScoreRing } from "../../components/ui/ScoreRing";
import { StatCard } from "../../components/ui/StatCard";
import { uiTheme } from "../../components/ui/theme";
import { usePedometer } from "../../hooks/usePedometer";
import { useAppStore } from "../../store/useAppStore";
import type { MealType, MoodRating, QualityRating, Task } from "../../types";
import { formatDuration, getGreeting, getTodayString } from "../../utils/date";
import * as storage from "../../utils/storage";

type QuickSheet = "food" | "water" | "task" | "mood" | null;

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function scoreMessage(score: number): string {
  if (score >= 90) return "Outstanding day";
  if (score >= 70) return "Great progress today";
  if (score >= 50) return "Keep going";
  if (score >= 30) return "Room to improve";
  return "Fresh start";
}

function defaultMealType(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 20) return "dinner";
  return "snack";
}

function formatSleepHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function qualityStars(rating: QualityRating): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function sortPreviewTasks(tasks: Task[]): Task[] {
  return [...tasks]
    .filter((task) => !task.isCompleted)
    .sort((a, b) => Number(b.isMIT) - Number(a.isMIT))
    .slice(0, 3);
}

export default function HomeScreen() {
  const profile = useAppStore((s) => s.profile);
  const dayScore = useAppStore((s) => s.dayScore);
  const todayFoodLog = useAppStore((s) => s.todayFoodLog);
  const waterLog = useAppStore((s) => s.waterLog);
  const waterConfig = useAppStore((s) => s.waterConfig);
  const tasks = useAppStore((s) => s.tasks);
  const habits = useAppStore((s) => s.habits);
  const habitLogs = useAppStore((s) => s.habitLogs);
  const todayWorkouts = useAppStore((s) => s.todayWorkouts);
  const sleepLog = useAppStore((s) => s.sleepLog);
  const moodLog = useAppStore((s) => s.moodLog);
  const aiConfig = useAppStore((s) => s.aiConfig);
  const stepLog = useAppStore((s) => s.stepLog);

  const logWater = useAppStore((s) => s.logWater);
  const removeLastWaterLog = useAppStore((s) => s.removeLastWaterLog);
  const completeTask = useAppStore((s) => s.completeTask);
  const addTask = useAppStore((s) => s.addTask);
  const setMorningMood = useAppStore((s) => s.setMorningMood);
  const recalculateDayScore = useAppStore((s) => s.recalculateDayScore);

  const appPreferences = useAppStore((s) => s.appPreferences);
  const dismissMorningBriefing = useAppStore((s) => s.dismissMorningBriefing);
  const { steps, isAvailable, permissionGranted, syncSteps } = usePedometer();

  const showStepsOnDashboard = appPreferences.showStepsOnDashboard;
  const showSteps = showStepsOnDashboard && isAvailable && permissionGranted;
  const effectiveGoalSteps = stepLog?.goalSteps ?? appPreferences.stepGoal;

  const [refreshing, setRefreshing] = useState(false);
  const [aiRefreshToken, setAiRefreshToken] = useState(0);
  const [activeSheet, setActiveSheet] = useState<QuickSheet>(null);
  const [foodMealType, setFoodMealType] = useState<MealType>(defaultMealType);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskIsMit, setTaskIsMit] = useState(false);
  const [showBriefing, setShowBriefing] = useState(
    !appPreferences.hasSeenMorningBriefing && new Date().getHours() < 14
  );

  const name = profile?.name ?? "there";
  const todayLabel = format(new Date(), "EEEE, MMM d");
  const isMorning = new Date().getHours() < 12;

  const bottlesConsumed = waterLog?.bottleCount ?? 0;
  const calorieGoal = profile?.dailyCalorieGoal ?? 0;
  const caloriesConsumed = todayFoodLog.totalCalories;
  const tasksCompleted = tasks.filter((t) => t.isCompleted).length;
  const previewTasks = useMemo(() => sortPreviewTasks(tasks), [tasks]);

  const habitsCompletedToday = useMemo(() => {
    const today = getTodayString();
    const activeHabits = habits.filter((h) => h.isActive);
    return activeHabits.filter((habit) =>
      habitLogs.some(
        (log) => log.habitId === habit.id && log.date === today && log.isCompleted
      )
    ).length;
  }, [habits, habitLogs]);

  const habitsTotal = habits.filter((h) => h.isActive).length;
  const habitsPercent =
    habitsTotal > 0 ? Math.round((habitsCompletedToday / habitsTotal) * 100) : 0;

  const lastNightSleep = useMemo(() => {
    if (sleepLog) return sleepLog;
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    return storage.getSleepLog(yesterday);
  }, [sleepLog]);

  const workoutSummary = useMemo(() => {
    if (todayWorkouts.length === 0) return "No workout logged";
    const minutes = todayWorkouts.reduce((sum, w) => sum + w.durationMinutes, 0);
    const calories = todayWorkouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
    const label =
      todayWorkouts.length === 1
        ? todayWorkouts[0].exerciseType.replace("_", " ")
        : `${todayWorkouts.length} workouts`;
    return `${label} · ${formatDuration(minutes)} · ${calories} kcal`;
  }, [todayWorkouts]);

  const hasBreakfast = todayFoodLog.entries.some((e) => e.mealType === "breakfast");
  const hasWater = bottlesConsumed > 0;
  const hasMorningMood = moodLog?.morningMood !== undefined;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncSteps();
      recalculateDayScore();
      setAiRefreshToken((n) => n + 1);
    } finally {
      setRefreshing(false);
    }
  }, [recalculateDayScore, syncSteps]);

  const openFoodSheet = (mealType?: MealType) => {
    setFoodMealType(mealType ?? defaultMealType());
    setActiveSheet("food");
  };

  const closeSheet = () => {
    setActiveSheet(null);
    setTaskTitle("");
    setTaskIsMit(false);
  };

  const submitTask = () => {
    const title = taskTitle.trim();
    if (!title) return;
    addTask({ title, isMIT: taskIsMit, isCompleted: false });
    closeSheet();
  };

  const onBottlePress = (index: number) => {
    const consumed = waterLog?.bottleCount ?? 0;
    if (index < consumed) {
      removeLastWaterLog();
    } else if (index === consumed) {
      logWater(1);
    }
  };

  const miniStats = [
    { icon: "🔥", value: dayScore.caloriesPercent },
    { icon: "💧", value: dayScore.waterPercent },
    { icon: "✅", value: dayScore.tasksPercent },
    { icon: "🏃", value: showSteps ? Math.min(100, Math.round((steps / effectiveGoalSteps) * 100)) : habitsPercent },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting(name)}</Text>
          <Text style={styles.date}>{todayLabel}</Text>
        </View>
        <Pressable
          style={styles.avatar}
          onPress={() => router.push("/(tabs)/settings")}
          accessibilityLabel="Open settings"
        >
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={uiTheme.accent}
            colors={[uiTheme.accent]}
          />
        }
      >
        <View style={styles.scoreSection}>
          <ScoreRing score={dayScore.overall} />
          <Text style={styles.scoreCaption}>
            {dayScore.overall} — {scoreMessage(dayScore.overall)}
          </Text>
          <View style={styles.miniStats}>
            {miniStats.map((stat) => (
              <View key={stat.icon} style={styles.miniStat}>
                <Text style={styles.miniIcon}>{stat.icon}</Text>
                <Text style={styles.miniValue}>{stat.value}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              label="Calories"
              value={`${caloriesConsumed}`}
              unit={`/ ${calorieGoal}`}
              progress={calorieGoal > 0 ? caloriesConsumed / calorieGoal : 0}
              color={uiTheme.warning}
            />
            <StatCard
              label="Water"
              value={bottlesConsumed}
              unit={`/ ${waterConfig.dailyGoalBottles} bottles`}
              progress={
                waterConfig.dailyGoalBottles > 0
                  ? bottlesConsumed / waterConfig.dailyGoalBottles
                  : 0
              }
              color={uiTheme.accent}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              label="Tasks"
              value={tasksCompleted}
              unit={`/ ${tasks.length}`}
              progress={tasks.length > 0 ? tasksCompleted / tasks.length : 1}
              color={uiTheme.success}
            />
            {showSteps ? (
              <StatCard
                label="Steps"
                value={steps.toLocaleString()}
                unit={`/ ${effectiveGoalSteps.toLocaleString()}`}
                progress={effectiveGoalSteps > 0 ? steps / effectiveGoalSteps : 0}
                color={uiTheme.accent}
              />
            ) : (
              <StatCard
                label="Habits"
                value={habitsPercent}
                unit="%"
                progress={habitsPercent / 100}
                color={uiTheme.success}
              />
            )}
          </View>
        </View>

        {aiConfig?.apiKey && aiConfig.model ? (
          <View style={styles.section}>
            <AICard refreshToken={aiRefreshToken} />
          </View>
        ) : null}

        <View style={styles.quickAdd}>
          <QuickAddButton label="+ Food" onPress={() => openFoodSheet()} />
          <QuickAddButton label="+ Water" onPress={() => setActiveSheet("water")} />
          <QuickAddButton label="+ Task" onPress={() => setActiveSheet("task")} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's focus</Text>
            <Pressable onPress={() => router.push("/(tabs)/focus")}>
              <Text style={styles.sectionLink}>See all →</Text>
            </Pressable>
          </View>

          {previewTasks.length === 0 ? (
            <Card variant="bordered">
              <Text style={styles.emptyText}>
                {tasks.length === 0
                  ? "No tasks yet. Add one to get started."
                  : "All tasks complete — nice work!"}
              </Text>
            </Card>
          ) : (
            previewTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onComplete={() => completeTask(task.id)}
              />
            ))
          )}
        </View>

        <View style={styles.dualCards}>
          <Card variant="bordered" style={styles.halfCard}>
            <Text style={styles.cardLabel}>Sleep</Text>
            <Text style={styles.cardValue}>
              {lastNightSleep
                ? `${formatSleepHours(lastNightSleep.durationHours)} last night ${qualityStars(lastNightSleep.qualityRating)}`
                : "No sleep logged"}
            </Text>
          </Card>
          <Card variant="bordered" style={styles.halfCard}>
            <Text style={styles.cardLabel}>Workout</Text>
            <Text style={styles.cardValue}>{workoutSummary}</Text>
          </Card>
        </View>

        {isMorning ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Morning routine</Text>
            <Card variant="bordered" style={styles.routineCard}>
              <RoutineItem
                label="Logged breakfast?"
                done={hasBreakfast}
                onPress={() => openFoodSheet("breakfast")}
              />
              <RoutineItem
                label="Drank water?"
                done={hasWater}
                onPress={() => {
                  if (!hasWater) logWater(1);
                }}
              />
              <RoutineItem
                label="Mood checked?"
                done={hasMorningMood}
                onPress={() => setActiveSheet("mood")}
              />
            </Card>
          </View>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomSheet
        visible={activeSheet === "food"}
        onClose={closeSheet}
        title="Add food"
        height="full"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <FoodSearchBar mealType={foodMealType} />
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={activeSheet === "water"}
        onClose={closeSheet}
        title="Log water"
        height="half"
      >
        <Text style={styles.sheetSub}>
          {bottlesConsumed} / {waterConfig.dailyGoalBottles} bottles today
        </Text>
        <BottleDisplay
          consumedBottles={bottlesConsumed}
          goalBottles={waterConfig.dailyGoalBottles}
          onBottlePress={onBottlePress}
        />
        <View style={styles.sheetActions}>
          <Button label="+ 1 bottle" onPress={() => logWater(1)} />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={activeSheet === "task"}
        onClose={closeSheet}
        title="Add task"
        height="half"
      >
        <Input
          label="Task title"
          value={taskTitle}
          onChangeText={setTaskTitle}
          placeholder="Finish project proposal"
        />
        <Pressable
          style={styles.mitToggle}
          onPress={() => setTaskIsMit((v) => !v)}
        >
          <View style={[styles.checkbox, taskIsMit && styles.checkboxChecked]}>
            {taskIsMit ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.mitLabel}>Mark as MIT (Most Important Task)</Text>
        </Pressable>
        <Button label="Add task" onPress={submitTask} />
      </BottomSheet>

      <BottomSheet
        visible={activeSheet === "mood"}
        onClose={closeSheet}
        title="Morning mood"
        height="half"
      >
        <MoodSelector
          label="How are you feeling?"
          value={moodLog?.morningMood}
          onChange={(rating: MoodRating) => {
            setMorningMood(rating);
            closeSheet();
          }}
        />
      </BottomSheet>

      <MorningBriefingModal
        visible={showBriefing}
        onDismiss={() => {
          setShowBriefing(false);
          dismissMorningBriefing();
        }}
      />
    </SafeAreaView>
  );
}

function QuickAddButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickBtn} onPress={onPress}>
      <Text style={styles.quickBtnText}>{label}</Text>
    </Pressable>
  );
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: () => void }) {
  return (
    <Pressable style={styles.taskRow} onPress={onComplete}>
      <View style={styles.taskCheckbox} />
      <View style={styles.taskBody}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        {task.isMIT ? <Text style={styles.mitBadge}>MIT</Text> : null}
      </View>
    </Pressable>
  );
}

function RoutineItem({
  label,
  done,
  onPress,
}: {
  label: string;
  done: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.routineRow} onPress={onPress}>
      <View style={[styles.routineCheck, done && styles.routineCheckDone]}>
        {done ? <Text style={styles.routineCheckMark}>✓</Text> : null}
      </View>
      <Text style={[styles.routineLabel, done && styles.routineLabelDone]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: uiTheme.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: uiTheme.background,
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.border,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    color: uiTheme.textPrimary,
    fontSize: 20,
    fontWeight: "800",
  },
  date: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: uiTheme.surface2,
    borderWidth: 1,
    borderColor: uiTheme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: uiTheme.accent,
    fontWeight: "800",
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  scoreSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  scoreCaption: {
    marginTop: 12,
    color: uiTheme.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  miniStats: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 14,
  },
  miniStat: {
    alignItems: "center",
    gap: 4,
  },
  miniIcon: {
    fontSize: 20,
  },
  miniValue: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  statsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: uiTheme.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  sectionLink: {
    color: uiTheme.accent,
    fontWeight: "600",
    fontSize: 14,
  },
  quickAdd: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: uiTheme.surface2,
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusInput,
    paddingVertical: 12,
    alignItems: "center",
  },
  quickBtnText: {
    color: uiTheme.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  emptyText: {
    color: uiTheme.textSecondary,
    fontSize: 14,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: uiTheme.surface1,
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusCard,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: uiTheme.accent,
  },
  taskBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  taskTitle: {
    color: uiTheme.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  mitBadge: {
    color: uiTheme.warning,
    fontSize: 11,
    fontWeight: "800",
    backgroundColor: `${uiTheme.warning}22`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: uiTheme.radiusPill,
    overflow: "hidden",
  },
  dualCards: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  halfCard: {
    flex: 1,
    marginBottom: 0,
  },
  cardLabel: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  cardValue: {
    color: uiTheme.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  routineCard: {
    marginTop: 10,
    gap: 4,
  },
  routineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  routineCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: uiTheme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  routineCheckDone: {
    borderColor: uiTheme.success,
    backgroundColor: `${uiTheme.success}33`,
  },
  routineCheckMark: {
    color: uiTheme.success,
    fontWeight: "800",
    fontSize: 14,
  },
  routineLabel: {
    color: uiTheme.textPrimary,
    fontSize: 15,
    fontWeight: "500",
  },
  routineLabelDone: {
    color: uiTheme.textSecondary,
    textDecorationLine: "line-through",
  },
  sheetSub: {
    color: uiTheme.textSecondary,
    marginBottom: 12,
    fontSize: 14,
  },
  sheetActions: {
    marginTop: 16,
  },
  mitToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: uiTheme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: uiTheme.accent,
    backgroundColor: uiTheme.accent,
  },
  checkMark: {
    color: uiTheme.textPrimary,
    fontWeight: "800",
    fontSize: 12,
  },
  mitLabel: {
    color: uiTheme.textPrimary,
    fontSize: 14,
    fontWeight: "500",
  },
  bottomSpacer: {
    height: 24,
  },
});
