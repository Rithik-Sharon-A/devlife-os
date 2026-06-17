import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { radii } from "../../utils/designTokens";

export type BadgeVariant = "accent" | "success" | "warning" | "danger" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: ReactNode;
  /** @deprecated Use variant instead */
  color?: string;
}

export function Badge({ label, variant = "accent", icon, color }: BadgeProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  const resolvedVariant: BadgeVariant = color
    ? variantFromLegacyColor(color, colors)
    : variant;

  const styles = useMemo(() => {
    const variants: Record<
      BadgeVariant,
      { bg: string; text: string; border: string }
    > = {
      accent: {
        bg: "rgba(124,106,255,0.15)",
        text: colors.accent,
        border: "rgba(124,106,255,0.3)",
      },
      success: {
        bg: "rgba(52,211,153,0.15)",
        text: colors.success,
        border: "rgba(52,211,153,0.3)",
      },
      warning: {
        bg: "rgba(251,191,36,0.15)",
        text: colors.warning,
        border: "rgba(251,191,36,0.3)",
      },
      danger: {
        bg: "rgba(248,113,113,0.15)",
        text: colors.danger,
        border: "rgba(248,113,113,0.3)",
      },
      neutral: {
        bg: "rgba(255,255,255,0.08)",
        text: colors.textSecondary,
        border: "transparent",
      },
    };

    const v = variants[resolvedVariant];

    return StyleSheet.create({
      badge: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: v.border,
        backgroundColor: v.bg,
        paddingVertical: 4,
        paddingHorizontal: 10,
      },
      icon: {
        marginRight: 6,
      },
      text: {
        fontSize: 12,
        fontWeight: "600",
        color: v.text,
      },
    });
  }, [colors, resolvedVariant]);

  return (
    <View style={styles.badge}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

function variantFromLegacyColor(
  color: string,
  colors: { accent: string; success: string; warning: string; danger: string }
): BadgeVariant {
  if (color === colors.success) return "success";
  if (color === colors.warning) return "warning";
  if (color === colors.danger) return "danger";
  if (color === colors.accent) return "accent";
  return "neutral";
}
