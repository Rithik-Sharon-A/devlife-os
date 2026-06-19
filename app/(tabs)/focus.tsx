import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FocusRing } from "../../components/focus/FocusRing";
import { SessionDots } from "../../components/focus/SessionDots";
import { TaskSelector } from "../../components/focus/TaskSelector";
import { useCelebrationContext } from "../../components/providers/CelebrationProvider";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { AnimatedCard, BounceButton } from "../../components/ui/MicroAnimations";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { uiTheme } from "../../components/ui/theme";
import { useFocusChime } from "../../hooks/useFocusChime";
import { useTimer } from "../../hooks/useTimer";
import { useAppStore } from "../../store/useAppStore";
import type { FocusSession, FocusSessionType } from "../../types";
import { formatDuration, formatTime, getTodayString } from "../../utils/date";

const SESSION_GOAL = 6;
const DURATION_PRESETS = [25, 45, 60] as const;
const DURATION_LABELS = ["25 min", "45 min", "60 min", "Custom"] as const;

type DurationLabel = (typeof DURATION_LABELS)[number];

function labelForMinutes(minutes: number): DurationLabel {
  if (minutes === 25) return "25 min";
  if (minutes === 45) return "45 min";
  if (minutes === 60) return "60 min";
  return "Custom";
}

function isTodaySession(session: FocusSession): boolean {
  return session.startTime.slice(0, 10) === getTodayString();
}

function sessionDurationSeconds(
  sessionType: FocusSessionType,
  workMinutes: number,
  breakMinutes: number
): number {
  return (sessionType === "work" ? workMinutes : breakMinutes) * 60;
}

export default function FocusScreen() {
  const { celebrate } = useCelebrationContext();
  const tasks = useAppStore((s) => s.tasks);
  const focusConfig = useAppStore((s) => s.focusConfig);
  const focusSessions = useAppStore((s) => s.focusSessions);
  const updateFocusConfig = useAppStore((s) => s.updateFocusConfig);

  const { playChime } = useFocusChime();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [durationLabel, setDurationLabel] = useState<DurationLabel>(() =>
    labelForMinutes(focusConfig.workMinutes)
  );
  const [customMinutes, setCustomMinutes] = useState(
    String(focusConfig.workMinutes)
  );

  const {
    secondsLeft,
    isRunning,
    isPaused,
    sessionType,
    sessionNumber,
    start,
    pause,
    resume,
    reset,
    skip,
    setWorkDuration,
  } = useTimer(selectedTaskId, { onSessionComplete: playChime });

  const todaySessions = useMemo(
    () =>
      [...focusSessions]
        .filter(isTodaySession)
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ),
    [focusSessions]
  );

  const completedWorkSessions = useMemo(
    () =>
      todaySessions.filter((s) => s.type === "work" && s.isCompleted).length,
    [todaySessions]
  );

  const prevCompletedRef = useRef(completedWorkSessions);

  useEffect(() => {
    if (completedWorkSessions <= prevCompletedRef.current) {
      prevCompletedRef.current = completedWorkSessions;
      return;
    }

    celebrate("focus_complete");

    void AsyncStorage.getItem("dayos:first_focus_done").then((done) => {
      if (!done) {
        celebrate("first_focus");
        void AsyncStorage.setItem("dayos:first_focus_done", "1");
      }
    });

    prevCompletedRef.current = completedWorkSessions;
  }, [celebrate, completedWorkSessions]);

  const totalFocusedMinutes = useMemo(
    () =>
      todaySessions
        .filter((s) => s.type === "work" && s.isCompleted)
        .reduce((sum, s) => sum + s.durationMinutes, 0),
    [todaySessions]
  );

  const totalSeconds = sessionDurationSeconds(
    sessionType,
    focusConfig.workMinutes,
    focusConfig.breakMinutes
  );

  const sessionLabel =
    sessionType === "work" ? "Work Session" : "Break Time";

  const canEditDuration = !isRunning && !isPaused && sessionType === "work";
  const showSkipBreak = sessionType === "break";

  const primaryLabel = isRunning
    ? "⏸ Pause"
    : isPaused
      ? "▶ Resume"
      : "▶ Start";

  const onPrimaryPress = () => {
    if (isRunning) pause();
    else if (isPaused) resume();
    else start();
  };

  const applyDuration = useCallback(
    (minutes: number) => {
      const safe = Math.max(1, Math.min(180, minutes));
      updateFocusConfig({ workMinutes: safe });
      setWorkDuration(safe);
      if (!DURATION_PRESETS.includes(safe as (typeof DURATION_PRESETS)[number])) {
        setDurationLabel("Custom");
        setCustomMinutes(String(safe));
      }
    },
    [setWorkDuration, updateFocusConfig]
  );

  const onDurationChange = (label: string) => {
    const next = label as DurationLabel;
    setDurationLabel(next);

    if (next === "Custom") return;

    const minutes = Number.parseInt(next, 10);
    if (!Number.isNaN(minutes)) applyDuration(minutes);
  };

  const onCustomDuration = (value: string) => {
    setCustomMinutes(value);
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed > 0) {
      applyDuration(parsed);
    }
  };

  const getTaskTitle = (taskId?: string) => {
    if (!taskId) return "General focus";
    return tasks.find((t) => t.id === taskId)?.title ?? "Unknown task";
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Focus</Text>
        <Badge
          label={`${completedWorkSessions} session${completedWorkSessions === 1 ? "" : "s"} today`}
          color={uiTheme.accent}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="bordered" style={styles.taskCard}>
          <Text style={styles.taskPrompt}>What are you working on?</Text>
          <TaskSelector
            tasks={tasks.filter((t) => !t.isCompleted)}
            selectedTaskId={selectedTaskId}
            onSelect={setSelectedTaskId}
          />
        </Card>

        <View style={styles.timerSection}>
          <AnimatedCard delay={50}>
            <FocusRing
              secondsLeft={secondsLeft}
              totalSeconds={totalSeconds}
              isRunning={isRunning}
              sessionLabel={sessionLabel}
            />
          </AnimatedCard>
        </View>

        <View style={styles.sessionProgress}>
          <SessionDots
            total={SESSION_GOAL}
            completed={completedWorkSessions}
            current={
              sessionType === "work"
                ? sessionNumber - 1
                : completedWorkSessions
            }
          />
          <Text style={styles.sessionCaption}>
            Session {Math.min(sessionNumber, SESSION_GOAL)} of {SESSION_GOAL} ·{" "}
            {focusConfig.breakMinutes} min break after this
          </Text>
        </View>

        <View style={styles.controls}>
          <BounceButton onPress={onPrimaryPress}>
            <View style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
            </View>
          </BounceButton>

          <View style={styles.secondaryRow}>
            <Pressable style={styles.secondaryBtn} onPress={reset}>
              <Text style={styles.secondaryBtnText}>↺ Reset</Text>
            </Pressable>
            {showSkipBreak ? (
              <Pressable style={styles.secondaryBtn} onPress={skip}>
                <Text style={styles.secondaryBtnText}>⏭ Skip Break</Text>
              </Pressable>
            ) : (
              <View style={styles.secondaryPlaceholder} />
            )}
          </View>
        </View>

        {canEditDuration ? (
          <View style={styles.durationSection}>
            <Text style={styles.durationLabel}>Work duration</Text>
            <SegmentedControl
              options={[...DURATION_LABELS]}
              selected={durationLabel}
              onChange={onDurationChange}
            />
            {durationLabel === "Custom" ? (
              <Input
                label="Custom minutes"
                value={customMinutes}
                onChangeText={onCustomDuration}
                placeholder="e.g. 35"
                keyboardType="number-pad"
              />
            ) : null}
          </View>
        ) : null}

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Today's sessions</Text>
          {todaySessions.length === 0 ? (
            <Card variant="bordered">
              <Text style={styles.historyEmpty}>No sessions logged yet.</Text>
            </Card>
          ) : (
            todaySessions.map((session) => (
              <View key={session.id} style={styles.historyRow}>
                <Text style={styles.historyText}>
                  {formatTime(session.startTime)} — {session.durationMinutes} min
                  {session.type === "work"
                    ? ` — Task: ${getTaskTitle(session.taskId)}`
                    : " break"}
                  {session.isCompleted ? " ✓" : ""}
                </Text>
              </View>
            ))
          )}
          <Text style={styles.historyTotal}>
            Total: {formatDuration(totalFocusedMinutes)} focused today
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  },
  title: {
    color: uiTheme.textPrimary,
    fontSize: 28,
    fontWeight: "800",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  taskCard: {
    marginBottom: 16,
    gap: 10,
  },
  taskPrompt: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  timerSection: {
    alignItems: "center",
    marginVertical: 8,
  },
  sessionProgress: {
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  sessionCaption: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  controls: {
    gap: 12,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: uiTheme.accent,
    borderRadius: uiTheme.radiusInput,
    paddingVertical: 18,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: uiTheme.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      web: { boxShadow: "0 4px 12px rgba(124,106,255,0.35)" },
    }),
  },
  primaryBtnText: {
    color: uiTheme.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: uiTheme.border,
    backgroundColor: uiTheme.surface2,
    borderRadius: uiTheme.radiusInput,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryPlaceholder: {
    flex: 1,
  },
  secondaryBtnText: {
    color: uiTheme.textPrimary,
    fontWeight: "600",
    fontSize: 15,
  },
  durationSection: {
    gap: 12,
    marginBottom: 24,
  },
  durationLabel: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  historySection: {
    gap: 8,
  },
  historyTitle: {
    color: uiTheme.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  historyEmpty: {
    color: uiTheme.textSecondary,
    fontSize: 14,
  },
  historyRow: {
    backgroundColor: uiTheme.surface1,
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusInput,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  historyText: {
    color: uiTheme.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  historyTotal: {
    color: uiTheme.accent,
    fontWeight: "700",
    fontSize: 14,
    marginTop: 8,
  },
});
