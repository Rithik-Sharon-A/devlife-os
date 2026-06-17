import type { ThemeColors } from "./themes";
import { getTheme, DEFAULT_THEME_ID } from "./themes";

let activeColors: ThemeColors = getTheme(DEFAULT_THEME_ID).colors;

export function setActiveThemeColors(colors: ThemeColors): void {
  activeColors = colors;
}

export function getActiveThemeColors(): ThemeColors {
  return activeColors;
}
