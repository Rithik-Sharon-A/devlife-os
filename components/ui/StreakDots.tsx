import { StyleSheet, Text, View } from "react-native";

import { uiTheme } from "./theme";

interface StreakDotsProps {
  last7Days: boolean[];
  streakCount: number;
}

export function StreakDots({ last7Days, streakCount }: StreakDotsProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {last7Days.slice(0, 7).map((done, index) => (
          <View
            key={`${index}-${done ? "1" : "0"}`}
            style={[styles.dot, done ? styles.done : styles.missed]}
          />
        ))}
      </View>
      <Text style={styles.count}>{streakCount} day streak</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "flex-start",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: uiTheme.radiusPill,
  },
  done: {
    backgroundColor: uiTheme.success,
  },
  missed: {
    borderWidth: 1,
    borderColor: uiTheme.border,
    backgroundColor: uiTheme.surface2,
  },
  count: {
    marginTop: 8,
    color: uiTheme.textSecondary,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
});
