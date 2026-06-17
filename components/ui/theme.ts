import { radii, spacing } from "../../utils/designTokens";
import { getActiveThemeColors } from "../../utils/themeBridge";

/** Legacy theme accessor — reads active theme colors via bridge (updates on theme change). */
export const uiTheme = {
  get background() {
    return getActiveThemeColors().background;
  },
  get surface1() {
    return getActiveThemeColors().surface1;
  },
  get surface2() {
    return getActiveThemeColors().surface2;
  },
  get surface3() {
    return getActiveThemeColors().surface3;
  },
  get accent() {
    return getActiveThemeColors().accent;
  },
  get success() {
    return getActiveThemeColors().success;
  },
  get warning() {
    return getActiveThemeColors().warning;
  },
  get danger() {
    return getActiveThemeColors().danger;
  },
  get textPrimary() {
    return getActiveThemeColors().textPrimary;
  },
  get textSecondary() {
    return getActiveThemeColors().textSecondary;
  },
  get border() {
    return getActiveThemeColors().border;
  },
  get radiusCard() {
    return radii.lg;
  },
  get radiusInput() {
    return radii.md;
  },
  get radiusPill() {
    return radii.pill;
  },
  spacing,
  radii,
} as const;

export { useTheme } from "../../context/ThemeContext";
