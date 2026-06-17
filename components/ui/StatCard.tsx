import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { radii, spacing } from "../../utils/designTokens";
import { typography } from "../../utils/typography";

export type StatChangeTrend = "up" | "down" | "neutral";

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  valueSuffix?: string;
  change?: {
    value: string;
    trend: StatChangeTrend;
  };
}

export function StatCard({
  icon,
  label,
  value,
  valueSuffix,
  change,
}: StatCardProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.surface2,
          borderRadius: radii.lg,
          padding: spacing.base,
        },
        topRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        icon: {
          fontSize: 20,
        },
        changeBadge: {
          borderRadius: radii.pill,
          paddingVertical: 2,
          paddingHorizontal: 8,
        },
        changeUp: {
          backgroundColor: "rgba(52,211,153,0.15)",
        },
        changeDown: {
          backgroundColor: "rgba(248,113,113,0.15)",
        },
        changeNeutral: {
          backgroundColor: "rgba(255,255,255,0.08)",
        },
        changeTextUp: { color: colors.success, fontSize: 11, fontWeight: "700" },
        changeTextDown: { color: colors.danger, fontSize: 11, fontWeight: "700" },
        changeTextNeutral: {
          color: colors.textSecondary,
          fontSize: 11,
          fontWeight: "700",
        },
        valueRow: {
          flexDirection: "row",
          alignItems: "baseline",
          marginTop: spacing.sm,
        },
        value: {
          ...typography.monoLarge,
          color: colors.textPrimary,
        },
        suffix: {
          fontSize: 16,
          fontWeight: "600",
          color: colors.textSecondary,
          marginLeft: 2,
        },
        label: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: spacing.xs,
        },
      }),
    [colors]
  );

  const changeStyle =
    change?.trend === "up"
      ? styles.changeUp
      : change?.trend === "down"
        ? styles.changeDown
        : styles.changeNeutral;

  const changeTextStyle =
    change?.trend === "up"
      ? styles.changeTextUp
      : change?.trend === "down"
        ? styles.changeTextDown
        : styles.changeTextNeutral;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.icon}>{icon}</Text>
        {change ? (
          <View style={[styles.changeBadge, changeStyle]}>
            <Text style={changeTextStyle}>{change.value}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {valueSuffix ? <Text style={styles.suffix}>{valueSuffix}</Text> : null}
      </View>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
    </View>
  );
}
