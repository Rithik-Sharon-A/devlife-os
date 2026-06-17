import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { radii, spacing } from "../../utils/designTokens";
import { getCardStyle } from "../../utils/cardStyles";
import { typography } from "../../utils/typography";

interface FocusSessionCardProps {
  time: string;
  subtitle: string;
  label?: string;
}

export function FocusSessionCard({
  time,
  subtitle,
  label = "Focus session",
}: FocusSessionCardProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          ...getCardStyle(theme),
          padding: spacing.base,
          borderWidth: 1,
          borderColor: `${colors.accent}44`,
          ...({
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
          } as object),
        },
        label: {
          ...typography.caption,
          color: colors.textSecondary,
        },
        time: {
          ...typography.mono,
          color: colors.textPrimary,
          marginTop: spacing.xs,
        },
        subtitle: {
          ...typography.bodySmall,
          color: colors.accent,
          marginTop: spacing.xs,
        },
      }),
    [colors, theme]
  );

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={styles.time}>{time}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
