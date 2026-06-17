import { Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import type { WaterLogEntry } from "../../types";
import { formatTime } from "../../utils/date";
import { uiTheme } from "../ui/theme";

interface WaterLogHistoryProps {
  entries: WaterLogEntry[];
  onDelete: (entryId: string) => void;
}

function formatBottleDelta(bottles: number): string {
  if (bottles === 1) return "+1 bottle";
  if (bottles === 0.5) return "+0.5 bottle";
  return `+${bottles.toFixed(1)} bottle`;
}

export function WaterLogHistory({ entries, onDelete }: WaterLogHistoryProps) {
  if (entries.length === 0) {
    return <Text style={styles.empty}>No water logged yet today.</Text>;
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <View>
      {sorted.map((entry) => (
        <Swipeable
          key={entry.id}
          renderRightActions={() => (
            <Pressable
              style={styles.deleteAction}
              onPress={() => onDelete(entry.id)}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          )}
        >
          <View style={styles.row}>
            <Text style={styles.time}>{formatTime(entry.timestamp)}</Text>
            <Text style={styles.detail}>
              {formatBottleDelta(entry.bottles)} · {entry.ml}ml
            </Text>
          </View>
        </Swipeable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: uiTheme.textSecondary,
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.border,
  },
  time: {
    color: uiTheme.textPrimary,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  detail: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  deleteAction: {
    width: 80,
    borderRadius: uiTheme.radiusInput,
    marginVertical: 4,
    marginLeft: 8,
    backgroundColor: uiTheme.danger,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "#1f1111",
    fontWeight: "700",
    fontSize: 13,
  },
});
