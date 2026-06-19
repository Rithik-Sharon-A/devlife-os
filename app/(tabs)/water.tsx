import { format, subDays } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCelebrationContext } from "../../components/providers/CelebrationProvider";
import { BottleDisplay } from "../../components/water/BottleDisplay";
import { WaterLogHistory } from "../../components/water/WaterLogHistory";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { uiTheme } from "../../components/ui/theme";
import { useAI } from "../../hooks/useAI";
import { useAppStore } from "../../store/useAppStore";
import { getLast7Days } from "../../utils/date";
import * as storage from "../../utils/storage";

function formatBottles(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function computeWaterStats(goalBottles: number, logs: Record<string, import("../../types").WaterLog>) {
  const last7 = getLast7Days();

  let totalBottles = 0;
  let bestBottles = 0;
  let daysWithData = 0;

  for (const date of last7) {
    const log = logs[date];
    if (!log) continue;
    daysWithData += 1;
    totalBottles += log.bottleCount;
    if (log.bottleCount > bestBottles) bestBottles = log.bottleCount;
  }

  const avgBottles = daysWithData > 0 ? totalBottles / daysWithData : 0;

  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    const log = logs[date];
    const met = log ? log.bottleCount >= goalBottles : false;
    if (i === 0 && !met) continue;
    if (met) streak += 1;
    else break;
  }

  return { avgBottles, bestBottles, streak };
}

function expectedBottlesByNow(goalBottles: number, hour: number): number {
  const dayProgress = Math.min(1, hour / 20);
  return goalBottles * dayProgress;
}

export default function WaterScreen() {
  const { celebrate } = useCelebrationContext();
  const waterLog = useAppStore((s) => s.waterLog);
  const waterConfig = useAppStore((s) => s.waterConfig);
  const aiConfig = useAppStore((s) => s.aiConfig);
  const logWaterMl = useAppStore((s) => s.logWaterMl);
  const removeWaterEntry = useAppStore((s) => s.removeWaterEntry);
  const updateWaterConfig = useAppStore((s) => s.updateWaterConfig);
  const recalculateDayScore = useAppStore((s) => s.recalculateDayScore);

  const { getWaterNudge } = useAI();

  const [refreshing, setRefreshing] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customMl, setCustomMl] = useState("");
  const [editBottleSize, setEditBottleSize] = useState(false);
  const [editGoal, setEditGoal] = useState(false);
  const [bottleSizeInput, setBottleSizeInput] = useState(
    String(waterConfig.bottleSizeMl)
  );
  const [goalInput, setGoalInput] = useState(String(waterConfig.dailyGoalBottles));
  const [nudgeText, setNudgeText] = useState<string | null>(null);
  const [nudgeLoading, setNudgeLoading] = useState(false);
  const [allWaterLogs, setAllWaterLogs] = useState<Record<string, import("../../types").WaterLog>>({});

  const isAiConfigured = Boolean(aiConfig?.apiKey && aiConfig.model);
  const hour = new Date().getHours();

  const bottlesConsumed = waterLog?.bottleCount ?? 0;
  const totalMl = waterLog?.totalMl ?? 0;
  const goalBottles = waterConfig.dailyGoalBottles;
  const bottleSize = waterConfig.bottleSizeMl;
  const goalMl = goalBottles * bottleSize;
  const percent = goalMl > 0 ? Math.min(100, Math.round((totalMl / goalMl) * 100)) : 0;
  const entries = waterLog?.entries ?? [];

  useEffect(() => {
    void storage.getAllWaterLogs().then(setAllWaterLogs);
  }, [bottlesConsumed, entries.length]);

  const stats = useMemo(
    () => computeWaterStats(goalBottles, allWaterLogs),
    [goalBottles, bottlesConsumed, entries.length, allWaterLogs]
  );

  const behindBottles = useMemo(() => {
    if (hour < 15) return 0;
    const expected = expectedBottlesByNow(goalBottles, hour);
    return Math.max(0, expected - bottlesConsumed);
  }, [hour, goalBottles, bottlesConsumed]);

  const showNudge = hour >= 15 && behindBottles >= 0.5;

  useEffect(() => {
    if (!showNudge) {
      setNudgeText(null);
      return;
    }

    if (!isAiConfigured) {
      setNudgeText(
        `You're ${behindBottles.toFixed(1)} bottles behind. Drink one now before your next break.`
      );
      return;
    }

    let cancelled = false;
    setNudgeLoading(true);
    void getWaterNudge().then((text) => {
      if (!cancelled) {
        setNudgeText(text);
        setNudgeLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [showNudge, behindBottles, isAiConfigured, getWaterNudge, bottlesConsumed]);

  useEffect(() => {
    setBottleSizeInput(String(waterConfig.bottleSizeMl));
    setGoalInput(String(waterConfig.dailyGoalBottles));
  }, [waterConfig.bottleSizeMl, waterConfig.dailyGoalBottles]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      recalculateDayScore();
    } finally {
      setRefreshing(false);
    }
  }, [recalculateDayScore]);

  const logWaterWithCelebration = useCallback(
    (ml: number) => {
      const prevBottles = waterLog?.bottleCount ?? 0;
      const goal = waterConfig.dailyGoalBottles;
      logWaterMl(ml);
      const nextBottles = prevBottles + ml / waterConfig.bottleSizeMl;
      if (prevBottles < goal && nextBottles >= goal) {
        celebrate("water_goal");
      }
    },
    [celebrate, logWaterMl, waterConfig.bottleSizeMl, waterConfig.dailyGoalBottles, waterLog?.bottleCount]
  );

  const logFull = () => logWaterWithCelebration(bottleSize);
  const logHalf = () => logWaterWithCelebration(Math.round(bottleSize / 2));

  const submitCustom = () => {
    const ml = Number(customMl);
    if (!Number.isNaN(ml) && ml > 0) {
      logWaterWithCelebration(ml);
      setCustomMl("");
      setCustomOpen(false);
    }
  };

  const applyBottleSize = () => {
    const val = Number(bottleSizeInput);
    if (!Number.isNaN(val) && val >= 100) {
      updateWaterConfig({ ...waterConfig, bottleSizeMl: val });
      setEditBottleSize(false);
    }
  };

  const applyGoal = () => {
    const val = Number(goalInput);
    if (!Number.isNaN(val) && val >= 1) {
      updateWaterConfig({ ...waterConfig, dailyGoalBottles: Math.round(val) });
      setEditGoal(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
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
        <Card variant="elevated" style={styles.headerCard}>
          <Text style={styles.headerMain}>
            {formatBottles(bottlesConsumed)} / {goalBottles} bottles
          </Text>
          <Text style={styles.headerSub}>
            {totalMl.toLocaleString()}ml of {goalMl.toLocaleString()}ml
          </Text>
          <Text style={styles.headerPercent}>{percent}% of daily goal</Text>
        </Card>

        <View style={styles.bottleSection}>
          <BottleDisplay
            consumedBottles={bottlesConsumed}
            goalBottles={goalBottles}
            bottleSizeMl={bottleSize}
            size="lg"
          />
        </View>

        <View style={styles.logButtons}>
          <Button
            label={`+ Full Bottle (${bottleSize}ml)`}
            onPress={logFull}
            size="lg"
          />
          <View style={styles.secondaryRow}>
            <Pressable style={styles.secondaryBtn} onPress={logHalf}>
              <Text style={styles.secondaryText}>
                + Half ({Math.round(bottleSize / 2)}ml)
              </Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => setCustomOpen(true)}
            >
              <Text style={styles.secondaryText}>+ Custom ml</Text>
            </Pressable>
          </View>
        </View>

        <Card variant="bordered" style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>My bottle is</Text>
            {editBottleSize ? (
              <View style={styles.inlineEdit}>
                <Input
                  value={bottleSizeInput}
                  onChangeText={setBottleSizeInput}
                  placeholder="750"
                  keyboardType="number-pad"
                />
                <Button label="Save" size="sm" onPress={applyBottleSize} />
              </View>
            ) : (
              <Pressable
                style={styles.settingValueRow}
                onPress={() => setEditBottleSize(true)}
              >
                <Text style={styles.settingValue}>{bottleSize} ml</Text>
                <Text style={styles.editLink}>Edit</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Daily goal:</Text>
            {editGoal ? (
              <View style={styles.inlineEdit}>
                <Input
                  value={goalInput}
                  onChangeText={setGoalInput}
                  placeholder="3"
                  keyboardType="number-pad"
                />
                <Button label="Save" size="sm" onPress={applyGoal} />
              </View>
            ) : (
              <Pressable
                style={styles.settingValueRow}
                onPress={() => setEditGoal(true)}
              >
                <Text style={styles.settingValue}>{goalBottles} bottles</Text>
                <Text style={styles.editLink}>Edit</Text>
              </Pressable>
            )}
          </View>
        </Card>

        {showNudge ? (
          <Card variant="bordered" style={styles.nudgeCard}>
            <Text style={styles.nudgeTitle}>Hydration reminder</Text>
            {nudgeLoading ? (
              <Text style={styles.nudgeBody}>Checking your progress...</Text>
            ) : (
              <Text style={styles.nudgeBody}>{nudgeText}</Text>
            )}
          </Card>
        ) : null}

        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Today's log</Text>
          <WaterLogHistory entries={entries} onDelete={removeWaterEntry} />
        </View>

        <View style={styles.statsRow}>
          <StatCell
            label="Avg / day"
            value={`${stats.avgBottles.toFixed(1)} bottles`}
          />
          <StatCell
            label="Best day"
            value={`${formatBottles(stats.bestBottles)} bottles`}
          />
          <StatCell label="Streak" value={`${stats.streak} days`} />
        </View>
      </ScrollView>

      <BottomSheet
        visible={customOpen}
        onClose={() => setCustomOpen(false)}
        title="Custom amount"
        height="half"
      >
        <Input
          label="Milliliters"
          value={customMl}
          onChangeText={setCustomMl}
          placeholder="e.g. 250"
          keyboardType="number-pad"
        />
        <View style={styles.sheetBtn}>
          <Button label="Log water" onPress={submitCustom} />
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: uiTheme.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  headerCard: {
    alignItems: "center",
    marginBottom: 20,
    gap: 6,
  },
  headerMain: {
    color: uiTheme.textPrimary,
    fontSize: 32,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  headerSub: {
    color: uiTheme.textSecondary,
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  headerPercent: {
    color: uiTheme.accent,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  bottleSection: {
    marginBottom: 24,
    paddingVertical: 8,
  },
  logButtons: {
    gap: 10,
    marginBottom: 20,
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
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryText: {
    color: uiTheme.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  settingsCard: {
    gap: 14,
    marginBottom: 16,
  },
  settingRow: {
    gap: 6,
  },
  settingLabel: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  settingValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingValue: {
    color: uiTheme.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  editLink: {
    color: uiTheme.accent,
    fontWeight: "700",
    fontSize: 14,
  },
  inlineEdit: {
    gap: 8,
  },
  nudgeCard: {
    marginBottom: 16,
    borderColor: uiTheme.warning,
  },
  nudgeTitle: {
    color: uiTheme.warning,
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 6,
  },
  nudgeBody: {
    color: uiTheme.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  timelineSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: uiTheme.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCell: {
    flex: 1,
    backgroundColor: uiTheme.surface1,
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusCard,
    padding: 12,
    alignItems: "center",
  },
  statLabel: {
    color: uiTheme.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: {
    color: uiTheme.textPrimary,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  sheetBtn: {
    marginTop: 12,
  },
});
