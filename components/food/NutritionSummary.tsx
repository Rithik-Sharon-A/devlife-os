import { StyleSheet, Text, View } from "react-native";

import { Card } from "../ui/Card";
import { uiTheme } from "../ui/theme";

interface NutritionSummaryProps {
  calories: number;
  calorieGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbGoal: number;
  fat: number;
  fatGoal: number;
  fiber: number;
  fiberGoal?: number;
  highlightProtein?: boolean;
}

function NutrientRow({
  label,
  value,
  goal,
  unit,
  color,
  highlighted,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  highlighted?: boolean;
}) {
  const progress = goal > 0 ? Math.min(1.2, value / goal) : 0;
  const fillWidth = Math.min(100, progress * 100);

  return (
    <View style={[styles.row, highlighted && styles.rowHighlight]}>
      <View style={styles.rowHead}>
        <Text style={[styles.rowLabel, highlighted && styles.rowLabelHighlight]}>
          {label}
        </Text>
        <Text style={styles.rowValue}>
          {Math.round(value)}
          {unit} / {goal}
          {unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${fillWidth}%`,
              backgroundColor: progress > 1 ? uiTheme.danger : color,
            },
          ]}
        />
      </View>
    </View>
  );
}

export function NutritionSummary({
  calories,
  calorieGoal,
  protein,
  proteinGoal,
  carbs,
  carbGoal,
  fat,
  fatGoal,
  fiber,
  fiberGoal = 25,
  highlightProtein = true,
}: NutritionSummaryProps) {
  const safeCalorieGoal = Math.max(1, calorieGoal);

  return (
    <Card variant="bordered" style={styles.card}>
      <Text style={styles.title}>Daily nutrition</Text>

      <NutrientRow
        label="Calories"
        value={calories}
        goal={safeCalorieGoal}
        unit=" kcal"
        color={uiTheme.warning}
      />
      <NutrientRow
        label="Protein"
        value={protein}
        goal={proteinGoal}
        unit="g"
        color="#60a5fa"
        highlighted={highlightProtein}
      />
      <NutrientRow
        label="Carbs"
        value={carbs}
        goal={carbGoal}
        unit="g"
        color="#fbbf24"
      />
      <NutrientRow
        label="Fat"
        value={fat}
        goal={fatGoal}
        unit="g"
        color="#f472b6"
      />
      <NutrientRow
        label="Fiber"
        value={fiber}
        goal={fiberGoal}
        unit="g"
        color={uiTheme.success}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
  },
  title: {
    color: uiTheme.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
  },
  row: {
    marginBottom: 12,
  },
  rowHighlight: {
    backgroundColor: `${"#60a5fa"}11`,
    borderRadius: uiTheme.radiusInput,
    padding: 8,
    marginHorizontal: -8,
  },
  rowHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  rowLabel: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  rowLabelHighlight: {
    color: "#60a5fa",
  },
  rowValue: {
    color: uiTheme.textPrimary,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  track: {
    height: 8,
    borderRadius: uiTheme.radiusPill,
    backgroundColor: uiTheme.surface3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: uiTheme.radiusPill,
  },
});
