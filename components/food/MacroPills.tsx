import { StyleSheet, Text, View } from "react-native";

import { uiTheme } from "../ui/theme";

interface MacroPillsProps {
  protein: number;
  carbs: number;
  fat: number;
}

function Pill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: `${color}66`, backgroundColor: `${color}22` }]}>
      <Text style={[styles.text, { color }]}>
        {label}: {Math.round(value)}g
      </Text>
    </View>
  );
}

export function MacroPills({ protein, carbs, fat }: MacroPillsProps) {
  return (
    <View style={styles.row}>
      <Pill label="P" value={protein} color="#60a5fa" />
      <Pill label="C" value={carbs} color="#fbbf24" />
      <Pill label="F" value={fat} color="#f472b6" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    borderWidth: 1,
    borderRadius: uiTheme.radiusPill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontWeight: "700",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
});
