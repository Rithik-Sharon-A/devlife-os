import { Pressable, StyleSheet, Text, View } from "react-native";

import type { FoodItem } from "../../types";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { uiTheme } from "../ui/theme";

interface FoodResultItemProps {
  item: FoodItem;
  onPress: (item: FoodItem) => void;
}

function sourceLabel(source: FoodItem["source"]): string {
  if (source === "local") return "Local";
  if (source === "api") return "Open Food Facts";
  if (source === "ai_estimate") return "AI Estimate";
  return "Custom";
}

export function FoodResultItem({ item, onPress }: FoodResultItemProps) {
  return (
    <Pressable onPress={() => onPress(item)}>
      <Card variant="bordered" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.main}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.serving}>
              {item.calories} kcal / {item.servingUnit}
            </Text>
          </View>
          <Badge label={sourceLabel(item.source)} color={uiTheme.accent} />
        </View>

        <View style={styles.macros}>
          <View style={[styles.pill, { backgroundColor: "#60a5fa22", borderColor: "#60a5fa66" }]}>
            <Text style={[styles.pillText, { color: "#60a5fa" }]}>P {item.protein}g</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: "#fbbf2422", borderColor: "#fbbf2466" }]}>
            <Text style={[styles.pillText, { color: "#fbbf24" }]}>C {item.carbs}g</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: "#f472b622", borderColor: "#f472b666" }]}>
            <Text style={[styles.pillText, { color: "#f472b6" }]}>F {item.fat}g</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  main: {
    flex: 1,
  },
  name: {
    color: uiTheme.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  serving: {
    color: uiTheme.textSecondary,
    marginTop: 4,
    fontSize: 12,
  },
  macros: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderRadius: uiTheme.radiusPill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
