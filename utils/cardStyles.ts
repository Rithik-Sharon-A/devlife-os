import { Platform, StyleSheet, type ViewStyle } from "react-native";

import type { AppTheme } from "./themes";
import { radii } from "./designTokens";

function accentAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Returns card container styles for the active theme family. */
export function getCardStyle(theme: AppTheme): ViewStyle {
  const { colors, cardTreatment } = theme;
  const base: ViewStyle = {
    borderRadius: radii.lg,
    backgroundColor: colors.surface1,
  };

  switch (cardTreatment) {
    case "glass":
      return {
        ...base,
        backgroundColor: accentAlpha(colors.surface1, 0.92),
        borderWidth: 1,
        borderColor: accentAlpha(colors.accent, 0.2),
      };
    case "bordered":
      return {
        ...base,
        borderLeftWidth: 3,
        borderLeftColor: colors.accent,
        borderTopWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
      };
    case "neon":
      return {
        ...base,
        borderWidth: 1.5,
        borderColor: colors.accent,
        ...Platform.select({
          ios: {
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
          },
          android: { elevation: 8 },
          default: {},
        }),
      };
    case "paper":
      return {
        ...base,
        backgroundColor: colors.surface1,
        ...Platform.select({
          ios: {
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
          },
          android: { elevation: 3 },
          default: {},
        }),
      };
    default:
      return base;
  }
}

export function getCardStylesheet(theme: AppTheme) {
  return StyleSheet.create({
    card: getCardStyle(theme),
  });
}
