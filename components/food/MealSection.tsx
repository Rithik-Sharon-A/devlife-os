import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import { useAppStore } from "../../store/useAppStore";
import type { MealEntry, MealType } from "../../types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { uiTheme } from "../ui/theme";

interface MealSectionProps {
  mealType: MealType;
  title: string;
  onAddPress: () => void;
}

export function MealSection({ mealType, title, onAddPress }: MealSectionProps) {
  const [open, setOpen] = useState(true);
  const entries = useAppStore((s) =>
    s.todayFoodLog.entries.filter((e) => e.mealType === mealType)
  );
  const removeMealEntry = useAppStore((s) => s.removeMealEntry);

  const total = entries.reduce((sum, e) => sum + e.calories, 0);

  return (
    <Card variant="bordered" style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.headerMain} onPress={() => setOpen((v) => !v)}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.total}>{total} kcal</Text>
          </View>
          <Text style={styles.chevron}>{open ? "▾" : "▸"}</Text>
        </Pressable>
        <Button label="+ Add" size="sm" onPress={onAddPress} />
      </View>

      {open ? (
        <View style={styles.list}>
          {entries.length === 0 ? (
            <Text style={styles.empty}>Nothing logged yet. Tap + to add</Text>
          ) : (
            entries.map((entry) => (
              <Swipeable
                key={entry.id}
                renderRightActions={() => (
                  <Pressable
                    style={styles.deleteAction}
                    onPress={() => removeMealEntry(entry.id)}
                  >
                    <Text style={styles.deleteText}>Delete</Text>
                  </Pressable>
                )}
              >
                <MealRow entry={entry} />
              </Swipeable>
            ))
          )}
        </View>
      ) : null}
    </Card>
  );
}

function MealRow({ entry }: { entry: MealEntry }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowName}>{entry.foodItem.name}</Text>
        <Text style={styles.rowSub}>x{entry.quantity}</Text>
      </View>
      <Text style={styles.rowKcal}>{entry.calories} kcal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 8,
  },
  chevron: {
    color: uiTheme.textSecondary,
    fontSize: 16,
    marginLeft: 8,
  },
  title: {
    color: uiTheme.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  total: {
    color: uiTheme.textSecondary,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  list: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: uiTheme.border,
    paddingTop: 8,
  },
  empty: {
    color: uiTheme.textSecondary,
    paddingVertical: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.border,
  },
  rowMain: {
    flex: 1,
    marginRight: 12,
  },
  rowName: {
    color: uiTheme.textPrimary,
    fontWeight: "600",
  },
  rowSub: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  rowKcal: {
    color: uiTheme.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: uiTheme.danger,
    borderRadius: uiTheme.radiusInput,
    width: 84,
    marginLeft: 8,
    marginVertical: 6,
  },
  deleteText: {
    color: "#1f1111",
    fontWeight: "700",
  },
});
