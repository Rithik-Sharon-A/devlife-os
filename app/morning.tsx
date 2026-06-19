import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAI } from "../hooks/useAI";
import { useAppStore } from "../store/useAppStore";
import type { MoodRating } from "../types";
import { isAIConfigured } from "../utils/ai";
import { APP_NAME } from "../utils/appBrand";
import { getCurrentStreak } from "../utils/habitStreak";
import {
  buildRuleBasedMission,
  completeMorningRitual,
  isMorningRitualDoneToday,
  loadYesterdaySnapshot,
} from "../utils/morningRitual";

const MOOD_OPTIONS: Array<{ value: MoodRating; emoji: string }> = [
  { value: 1, emoji: "😴" },
  { value: 2, emoji: "😐" },
  { value: 3, emoji: "🙂" },
  { value: 4, emoji: "😊" },
  { value: 5, emoji: "🤩" },
];

export default function MorningScreen() {
  const profile = useAppStore((s) => s.profile);
  const habits = useAppStore((s) => s.habits);
  const habitLogs = useAppStore((s) => s.habitLogs);
  const waterConfig = useAppStore((s) => s.waterConfig);
  const aiConfig = useAppStore((s) => s.aiConfig);
  const setMorningMood = useAppStore((s) => s.setMorningMood);

  const { askAI } = useAI();

  const [selectedMood, setSelectedMood] = useState<MoodRating | null>(null);
  const [yesterday, setYesterday] = useState<Awaited<
    ReturnType<typeof loadYesterdaySnapshot>
  > | null>(null);
  const [mission, setMission] = useState("");
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const name = profile?.name ?? "there";
  const todayLabel = format(new Date(), "EEEE, MMM d");

  const streak = useMemo(() => {
    const active = habits.filter((h) => h.isActive);
    if (active.length === 0) return 0;
    return Math.max(...active.map((h) => getCurrentStreak(h.id, habitLogs)));
  }, [habits, habitLogs]);

  useEffect(() => {
    void (async () => {
      if (await isMorningRitualDoneToday()) {
        router.replace("/(tabs)");
        return;
      }

      if (!profile) {
        router.replace("/(tabs)");
        return;
      }

      const snap = await loadYesterdaySnapshot(
        profile,
        habits,
        habitLogs,
        waterConfig
      );
      setYesterday(snap);

      let missionText = buildRuleBasedMission(profile, snap, waterConfig);

      if (isAIConfigured(aiConfig)) {
        try {
          const aiMission = await askAI(
            `You are ${APP_NAME}, a concise daily coach. Reply with ONE sentence starting with "Today's mission:". Be specific with numbers.`,
            `${name}'s calorie goal is ${profile.dailyCalorieGoal} kcal. Water goal is ${waterConfig.dailyGoalBottles} bottles. Yesterday score: ${snap.score}%. Water ${snap.waterPct}%, calories ${snap.caloriesPct}%, habits ${snap.habitsPct}%. Write one actionable mission for today.`
          );
          if (aiMission.trim()) {
            missionText = aiMission.trim().startsWith("Today's mission")
              ? aiMission.trim()
              : `Today's mission: ${aiMission.trim()}`;
          }
        } catch {
          // keep rule-based fallback
        }
      }

      setMission(missionText);
      setLoading(false);
    })();
  }, [
    aiConfig,
    askAI,
    habitLogs,
    habits,
    name,
    profile,
    waterConfig,
  ]);

  const startDay = async () => {
    if (!selectedMood) return;

    setMorningMood(selectedMood);
    await completeMorningRitual(selectedMood, mission);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      router.replace("/(tabs)");
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
        <View style={styles.gradientTop} />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {streak > 0 ? (
            <View style={styles.streakBanner}>
              <Text style={styles.streakText}>
                🔥 {streak} day streak — don't break it
              </Text>
            </View>
          ) : (
            <View style={styles.streakBannerGreen}>
              <Text style={styles.streakTextGreen}>Start your streak today 🌱</Text>
            </View>
          )}

          <Text style={styles.greeting}>Good morning, {name} 👋</Text>
          <Text style={styles.date}>{todayLabel}</Text>

          <View style={styles.reportCard}>
            <Text style={styles.reportLabel}>YESTERDAY</Text>
            {yesterday?.hasData ? (
              <>
                <Text style={styles.reportScore}>
                  {yesterday.score}% — {yesterday.scoreLabel}
                </Text>
                <Text style={styles.reportSummary}>{yesterday.summary}</Text>
              </>
            ) : (
              <Text style={styles.reportSummary}>
                First day! Let's set a strong baseline.
              </Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>How are you feeling right now?</Text>
          <View style={styles.moodRow}>
            {MOOD_OPTIONS.map((option) => {
              const selected = selectedMood === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setSelectedMood(option.value)}
                  style={[styles.moodBtn, selected && styles.moodBtnSelected]}
                >
                  <Text style={styles.moodEmoji}>{option.emoji}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.missionCard}>
            <Text style={styles.missionLabel}>TODAY'S MISSION</Text>
            <Text style={styles.missionText}>
              {loading ? "Preparing your mission..." : mission}
            </Text>
          </View>

          <Pressable
            style={[
              styles.startBtn,
              !selectedMood && styles.startBtnDisabled,
            ]}
            onPress={() => void startDay()}
            disabled={!selectedMood || loading}
          >
            <Text style={styles.startBtnText}>Start my day →</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  flex: {
    flex: 1,
  },
  gradientTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: "rgba(124,106,255,0.08)",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 20,
  },
  streakBanner: {
    backgroundColor: "rgba(124,106,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(124,106,255,0.3)",
    borderRadius: 12,
    padding: 12,
  },
  streakText: {
    color: "#7c6aff",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  streakBannerGreen: {
    backgroundColor: "rgba(52,211,153,0.12)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.25)",
    borderRadius: 12,
    padding: 12,
  },
  streakTextGreen: {
    color: "#34d399",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f0f0ff",
  },
  date: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: -12,
  },
  reportCard: {
    backgroundColor: "#13131a",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  reportLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6b7280",
    letterSpacing: 0.8,
  },
  reportScore: {
    fontSize: 18,
    fontWeight: "700",
    color: "#f0f0ff",
  },
  reportSummary: {
    fontSize: 14,
    color: "#9ca3af",
    lineHeight: 21,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f0f0ff",
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  moodBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#13131a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  moodBtnSelected: {
    borderColor: "#7c6aff",
    borderWidth: 2,
    transform: [{ scale: 1.08 }],
  },
  moodEmoji: {
    fontSize: 26,
  },
  missionCard: {
    backgroundColor: "rgba(124,106,255,0.12)",
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#7c6aff",
    gap: 8,
  },
  missionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7c6aff",
    letterSpacing: 0.8,
  },
  missionText: {
    fontSize: 15,
    color: "#f0f0ff",
    lineHeight: 22,
  },
  startBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#7c6aff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  startBtnDisabled: {
    opacity: 0.45,
  },
  startBtnText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
});
