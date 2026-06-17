import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import type { Habit, HabitLog } from "../../types";
import {
  getCurrentStreak,
  getLast7DayCompletion,
} from "../../utils/habitStreak";
import { StreakDots } from "../ui/StreakDots";
import { uiTheme } from "../ui/theme";

interface HabitRowProps {
  habit: Habit;
  done: boolean;
  logs: HabitLog[];
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitRow({
  habit,
  done,
  logs,
  onToggle,
  onEdit,
  onDelete,
}: HabitRowProps) {
  const streak = getCurrentStreak(habit.id, logs);
  const last7 = getLast7DayCompletion(habit.id, logs);

  const onLongPress = () => {
    Alert.alert(habit.name, "What would you like to do?", [
      { text: "Edit", onPress: onEdit },
      { text: "Delete", style: "destructive", onPress: onDelete },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <Pressable
      onLongPress={onLongPress}
      style={[styles.row, done && styles.rowDone]}
    >
      <Pressable
        onPress={onToggle}
        style={[styles.checkbox, done && { borderColor: habit.color, backgroundColor: `${habit.color}33` }]}
        hitSlop={8}
      >
        {done ? <Text style={styles.check}>✓</Text> : null}
      </Pressable>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{habit.icon}</Text>
          <Text style={[styles.name, done && styles.nameDone]}>{habit.name}</Text>
        </View>
        <Text style={styles.streak}>🔥 {streak} day{streak === 1 ? "" : "s"}</Text>
        <StreakDots last7Days={last7} streakCount={streak} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.border,
  },
  rowDone: {
    opacity: 0.72,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: uiTheme.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  check: {
    color: uiTheme.textPrimary,
    fontWeight: "800",
    fontSize: 16,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  name: {
    color: uiTheme.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  nameDone: {
    textDecorationLine: "line-through",
    color: uiTheme.textSecondary,
  },
  streak: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
});
