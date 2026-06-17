import { format, parseISO } from "date-fns";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddHabitSheet } from "../../components/habits/AddHabitSheet";
import { HabitRow } from "../../components/habits/HabitRow";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/Input";
import { MoodSelector } from "../../components/ui/MoodSelector";
import { RingProgress } from "../../components/ui/RingProgress";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { uiTheme } from "../../components/ui/theme";
import { useAI } from "../../hooks/useAI";
import { useAppStore } from "../../store/useAppStore";
import type { Habit, MoodRating } from "../../types";
import { formatTime, getTodayString } from "../../utils/date";
import { encouragementForProgress } from "../../utils/habitStreak";

type MainTab = "Habits" | "Reflect";

function isHabitDoneToday(
  habitId: string,
  today: string,
  logs: ReturnType<typeof useAppStore.getState>["habitLogs"]
): boolean {
  return logs.some(
    (log) => log.habitId === habitId && log.date === today && log.isCompleted
  );
}

export default function HabitsScreen() {
  const [mainTab, setMainTab] = useState<MainTab>("Habits");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Habits</Text>
        <SegmentedControl
          options={["Habits", "Reflect"]}
          selected={mainTab}
          onChange={(tab) => setMainTab(tab as MainTab)}
        />
      </View>

      {mainTab === "Habits" ? <HabitsTab /> : <ReflectTab />}
    </SafeAreaView>
  );
}

function HabitsTab() {
  const habits = useAppStore((s) => s.habits);
  const habitLogs = useAppStore((s) => s.habitLogs);
  const toggleHabit = useAppStore((s) => s.toggleHabit);
  const addHabit = useAppStore((s) => s.addHabit);
  const editHabit = useAppStore((s) => s.editHabit);
  const deleteHabit = useAppStore((s) => s.deleteHabit);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const today = getTodayString();

  const activeHabits = useMemo(
    () => habits.filter((h) => h.isActive),
    [habits]
  );

  const { pending, completed } = useMemo(() => {
    const pendingList: Habit[] = [];
    const completedList: Habit[] = [];

    for (const habit of activeHabits) {
      if (isHabitDoneToday(habit.id, today, habitLogs)) {
        completedList.push(habit);
      } else {
        pendingList.push(habit);
      }
    }

    return { pending: pendingList, completed: completedList };
  }, [activeHabits, habitLogs, today]);

  const doneCount = completed.length;
  const totalCount = activeHabits.length;
  const progress = totalCount > 0 ? doneCount / totalCount : 0;

  const openAdd = () => {
    setEditingHabit(null);
    setSheetOpen(true);
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingHabit(null);
  };

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="elevated" style={styles.progressCard}>
          <View style={styles.progressRow}>
            <RingProgress
              size={76}
              progress={progress}
              color={uiTheme.accent}
              strokeWidth={8}
            >
              <Text style={styles.progressFraction}>
                {doneCount}/{totalCount}
              </Text>
            </RingProgress>
            <View style={styles.progressCopy}>
              <Text style={styles.progressTitle}>
                {doneCount} of {totalCount} habits done
              </Text>
              <Text style={styles.progressMessage}>
                {encouragementForProgress(doneCount, totalCount)}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.listSection}>
          {activeHabits.length === 0 ? (
            <EmptyState
              icon="✅"
              message="No habits set up yet."
              action={
                <Button
                  label="Add your first habit"
                  size="sm"
                  onPress={openAdd}
                />
              }
            />
          ) : null}

          {pending.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              done={false}
              logs={habitLogs}
              onToggle={() => toggleHabit(habit.id)}
              onEdit={() => openEdit(habit)}
              onDelete={() => deleteHabit(habit.id)}
            />
          ))}

          {completed.length > 0 ? (
            <Text style={styles.completedHeader}>Completed</Text>
          ) : null}

          {completed.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              done
              logs={habitLogs}
              onToggle={() => toggleHabit(habit.id)}
              onEdit={() => openEdit(habit)}
              onDelete={() => deleteHabit(habit.id)}
            />
          ))}
        </View>

        {activeHabits.length > 0 ? (
          <Button label="+ Add Habit" variant="secondary" onPress={openAdd} />
        ) : null}
      </ScrollView>

      <BottomSheet
        visible={sheetOpen}
        onClose={closeSheet}
        title={editingHabit ? "Edit habit" : "Add habit"}
        height="full"
      >
        <AddHabitSheet
          initial={editingHabit ?? undefined}
          onSave={(values) => {
            if (editingHabit) {
              editHabit(editingHabit.id, values);
            } else {
              addHabit(values);
            }
            closeSheet();
          }}
        />
      </BottomSheet>
    </>
  );
}

function ReflectTab() {
  const moodLog = useAppStore((s) => s.moodLog);
  const todayGratitude = useAppStore((s) => s.todayGratitude);
  const journalEntries = useAppStore((s) => s.journalEntries);
  const aiConfig = useAppStore((s) => s.aiConfig);

  const setMorningMood = useAppStore((s) => s.setMorningMood);
  const setEveningMood = useAppStore((s) => s.setEveningMood);
  const setStressLevel = useAppStore((s) => s.setStressLevel);
  const saveGratitude = useAppStore((s) => s.saveGratitude);
  const addJournalEntry = useAppStore((s) => s.addJournalEntry);

  const { getDaySummary } = useAI();

  const [morningMood, setMorningMoodLocal] = useState<MoodRating | undefined>(
    moodLog?.morningMood
  );
  const [gratitudeItems, setGratitudeItems] = useState<string[]>(
    todayGratitude?.items ?? ["", "", ""]
  );
  const [eveningMood, setEveningMoodLocal] = useState<MoodRating | undefined>(
    moodLog?.eveningMood
  );
  const [stress, setStress] = useState(moodLog?.stressLevel ?? 5);
  const [reflection, setReflection] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalDraft, setJournalDraft] = useState("");
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(
    null
  );

  useEffect(() => {
    setMorningMoodLocal(moodLog?.morningMood);
    setEveningMoodLocal(moodLog?.eveningMood);
    setStress(moodLog?.stressLevel ?? 5);
    if (todayGratitude?.items?.length) {
      const items = [...todayGratitude.items];
      while (items.length < 3) items.push("");
      setGratitudeItems(items.slice(0, 3));
    }
  }, [moodLog, todayGratitude]);

  const isAiConfigured = Boolean(aiConfig?.apiKey && aiConfig.model);
  const hour = new Date().getHours();
  const morningDone =
    Boolean(moodLog?.morningMood) &&
    Boolean(todayGratitude?.items?.some((item) => item.trim()));
  const showMorning = hour < 12 || !morningDone;

  const recentJournal = journalEntries.slice(0, 3);

  const saveMorning = () => {
    if (morningMood) setMorningMood(morningMood);
    const items = gratitudeItems.map((item) => item.trim()).filter(Boolean);
    if (items.length > 0) saveGratitude(items);
  };

  const saveEvening = () => {
    if (eveningMood) setEveningMood(eveningMood);
    setStressLevel(stress);
    const trimmed = reflection.trim();
    if (trimmed) {
      addJournalEntry(trimmed, ["evening-reflection"]);
      setReflection("");
    }
  };

  const fetchSummary = async () => {
    if (!isAiConfigured) return;
    setSummaryLoading(true);
    try {
      const text = await getDaySummary();
      setSummary(text);
    } catch {
      setSummary("Could not generate summary right now.");
    } finally {
      setSummaryLoading(false);
    }
  };

  const saveJournal = () => {
    const trimmed = journalDraft.trim();
    if (!trimmed) return;
    addJournalEntry(trimmed);
    setJournalDraft("");
    setJournalOpen(false);
  };

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {showMorning ? (
          <Card variant="bordered" style={styles.reflectCard}>
            <Text style={styles.reflectTitle}>Morning check-in</Text>
            <MoodSelector
              label="How are you feeling?"
              value={morningMood}
              onChange={setMorningMoodLocal}
            />
            <Text style={styles.gratitudeLabel}>
              3 things you're grateful for today
            </Text>
            {gratitudeItems.map((item, index) => (
              <Input
                key={index}
                value={item}
                onChangeText={(text) => {
                  const next = [...gratitudeItems];
                  next[index] = text;
                  setGratitudeItems(next);
                }}
                placeholder={`Gratitude ${index + 1}`}
              />
            ))}
            <Button label="Save Morning Check-in" onPress={saveMorning} />
          </Card>
        ) : null}

        <Card variant="bordered" style={styles.reflectCard}>
          <Text style={styles.reflectTitle}>Evening Reflection</Text>
          <MoodSelector
            label="Evening mood"
            value={eveningMood}
            onChange={setEveningMoodLocal}
          />

          <Text style={styles.stressLabel}>Stress level: {stress}/10</Text>
          <View style={styles.stressRow}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
              <Pressable
                key={level}
                onPress={() => setStress(level)}
                style={[
                  styles.stressDot,
                  level <= stress && styles.stressDotActive,
                ]}
              />
            ))}
          </View>

          <Text style={styles.reflectLabel}>How did today go?</Text>
          <TextInput
            value={reflection}
            onChangeText={setReflection}
            placeholder="Write a few sentences about your day..."
            placeholderTextColor={uiTheme.textSecondary}
            multiline
            style={styles.reflectionInput}
          />
          <Button label="Save Reflection" onPress={saveEvening} />
        </Card>

        <Card variant="elevated" style={styles.reflectCard}>
          {isAiConfigured ? (
            <>
              <Button
                label="✨ Get AI summary of my day"
                variant="secondary"
                onPress={fetchSummary}
                loading={summaryLoading}
              />
              {summary ? (
                <Text style={styles.summaryText}>{summary}</Text>
              ) : null}
            </>
          ) : (
            <Pressable onPress={() => router.push("/(tabs)/settings")}>
              <Text style={styles.aiDisabled}>
                Add AI key in settings to unlock day summaries
              </Text>
            </Pressable>
          )}
        </Card>

        <Card variant="bordered" style={styles.reflectCard}>
          <Button
            label="📝 Write in journal"
            variant="ghost"
            onPress={() => setJournalOpen(true)}
          />

          {recentJournal.length === 0 ? (
            <Text style={styles.journalEmpty}>
              Your journal is empty. Write your first entry.
            </Text>
          ) : (
            <View style={styles.journalList}>
              <Text style={styles.journalHeading}>Recent entries</Text>
              {recentJournal.map((entry) => {
                const expanded = expandedJournalId === entry.id;
                return (
                  <Pressable
                    key={entry.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Journal entry from ${format(parseISO(entry.timestamp), "MMM d")}`}
                    onPress={() =>
                      setExpandedJournalId(expanded ? null : entry.id)
                    }
                    style={styles.journalItem}
                  >
                    <Text style={styles.journalTime}>
                      {formatTime(entry.timestamp)} ·{" "}
                      {format(parseISO(entry.timestamp), "MMM d")}
                    </Text>
                    <Text
                      style={styles.journalPreview}
                      numberOfLines={expanded ? undefined : 2}
                    >
                      {entry.content}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>
      </ScrollView>

      <Modal visible={journalOpen} animationType="slide">
        <SafeAreaView style={styles.journalModal}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.journalModalHeader}>
              <Pressable
                onPress={() => setJournalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel journal"
              >
                <Text style={styles.journalCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.journalModalTitle}>Journal</Text>
              <Pressable
                onPress={saveJournal}
                accessibilityRole="button"
                accessibilityLabel="Save journal entry"
              >
                <Text style={styles.journalSave}>Save</Text>
              </Pressable>
            </View>
            <TextInput
              value={journalDraft}
              onChangeText={setJournalDraft}
              placeholder="What's on your mind?"
              placeholderTextColor={uiTheme.textSecondary}
              multiline
              autoFocus
              returnKeyType="default"
              style={styles.journalEditor}
            />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: uiTheme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  screenTitle: {
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
    gap: 16,
  },
  progressCard: {
    marginBottom: 4,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  progressFraction: {
    color: uiTheme.textPrimary,
    fontWeight: "800",
    fontSize: 15,
    fontVariant: ["tabular-nums"],
  },
  progressCopy: {
    flex: 1,
    gap: 6,
  },
  progressTitle: {
    color: uiTheme.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  progressMessage: {
    color: uiTheme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  listSection: {
    backgroundColor: uiTheme.surface1,
    borderRadius: uiTheme.radiusCard,
    borderWidth: 1,
    borderColor: uiTheme.border,
    overflow: "hidden",
    marginBottom: 8,
  },
  completedHeader: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: uiTheme.surface2,
  },
  reflectCard: {
    gap: 12,
  },
  reflectTitle: {
    color: uiTheme.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  gratitudeLabel: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  stressLabel: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  stressRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  stressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: uiTheme.border,
    backgroundColor: uiTheme.surface2,
  },
  stressDotActive: {
    backgroundColor: uiTheme.accent,
    borderColor: uiTheme.accent,
  },
  reflectLabel: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  reflectionInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusInput,
    backgroundColor: uiTheme.surface2,
    color: uiTheme.textPrimary,
    padding: 12,
    textAlignVertical: "top",
    fontSize: 15,
    lineHeight: 22,
  },
  summaryText: {
    color: uiTheme.textPrimary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4,
  },
  aiDisabled: {
    color: uiTheme.textSecondary,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  journalEmpty: {
    color: uiTheme.textSecondary,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  journalList: {
    gap: 8,
    marginTop: 4,
  },
  journalHeading: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  journalItem: {
    borderTopWidth: 1,
    borderTopColor: uiTheme.border,
    paddingTop: 10,
  },
  journalTime: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  journalPreview: {
    color: uiTheme.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  journalModal: {
    flex: 1,
    backgroundColor: uiTheme.background,
  },
  journalModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.border,
  },
  journalModalTitle: {
    color: uiTheme.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  journalCancel: {
    color: uiTheme.textSecondary,
    fontWeight: "600",
  },
  journalSave: {
    color: uiTheme.accent,
    fontWeight: "700",
  },
  journalEditor: {
    flex: 1,
    color: uiTheme.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    padding: 20,
    textAlignVertical: "top",
  },
});
