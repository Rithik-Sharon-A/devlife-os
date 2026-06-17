import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Card } from "./Card";
import { uiTheme } from "./theme";

interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  progress?: number;
}

export function StatCard({
  icon,
  label,
  value,
  unit,
  color = uiTheme.accent,
  progress,
}: StatCardProps) {
  const showProgress = typeof progress === "number";
  const normalizedProgress = showProgress
    ? Math.max(0, Math.min(1, progress))
    : 0;

  return (
    <Card variant="bordered" style={styles.container}>
      <View style={styles.headRow}>
        <Text style={styles.label}>{label}</Text>
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {showProgress ? (
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${normalizedProgress * 100}%`, backgroundColor: color },
            ]}
          />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 120,
    justifyContent: "space-between",
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconWrap: {
    marginLeft: 8,
  },
  label: {
    color: uiTheme.textSecondary,
    fontSize: 13,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 8,
  },
  value: {
    color: uiTheme.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  unit: {
    color: uiTheme.textSecondary,
    marginLeft: 6,
    fontSize: 14,
  },
  progressTrack: {
    height: 8,
    borderRadius: uiTheme.radiusPill,
    backgroundColor: uiTheme.surface3,
    overflow: "hidden",
    marginTop: 14,
  },
  progressFill: {
    height: "100%",
    borderRadius: uiTheme.radiusPill,
  },
});
