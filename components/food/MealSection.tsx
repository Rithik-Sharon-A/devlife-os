import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppStore } from "../../store/useAppStore";
import type { MealType } from "../../types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { uiTheme } from "../ui/theme";

interface MealSectionProps {
  mealType: MealType;
  title: string;
  onRowPress: () => void;
  onAddPress: () => void;
}

export function MealSection({
  title,
  mealType,
  onRowPress,
  onAddPress,
}: MealSectionProps) {
  const allEntries = useAppStore((s) => s.todayFoodLog.entries);

  const entries = useMemo(
    () => allEntries.filter((e) => e.mealType === mealType),
    [allEntries, mealType]
  );

  const total = entries.reduce((sum, e) => sum + e.calories, 0);
  const itemCount = entries.length;

  return (
    <Card variant="bordered" style={styles.container}>
      <View style={styles.row}>
        <Pressable
          style={styles.rowMain}
          onPress={onRowPress}
          accessibilityRole="button"
          accessibilityLabel={`${title}, ${total} calories, ${itemCount} items`}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.total}>{total} kcal</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        <Button label="+ Add" size="sm" onPress={onAddPress} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 40,
  },
  title: {
    color: uiTheme.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  total: {
    color: uiTheme.textSecondary,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  chevron: {
    marginLeft: "auto",
    color: uiTheme.textSecondary,
    fontSize: 20,
    fontWeight: "300",
  },
});
