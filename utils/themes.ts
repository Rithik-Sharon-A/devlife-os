import {
  midnightCore,
  parchmentLight,
  semanticColors,
  tabBar,
  themeAccents,
} from "./designTokens";

export type AppThemeId =
  | "midnight"
  | "aurora"
  | "ember"
  | "sakura"
  | "ocean"
  | "forest"
  | "neonTokyo"
  | "parchment";

export type CardTreatment = "glass" | "bordered" | "neon" | "paper";

export interface ThemeColors {
  background: string;
  surface1: string;
  surface2: string;
  surface3: string;
  accent: string;
  accentSecondary?: string;
  text: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  tabBar: string;
  success: string;
  warning: string;
  danger: string;
}

export interface AppTheme {
  id: AppThemeId;
  name: string;
  emoji: string;
  cardTreatment: CardTreatment;
  isLight: boolean;
  colors: ThemeColors;
}

function darkTheme(
  id: AppThemeId,
  name: string,
  emoji: string,
  cardTreatment: CardTreatment,
  accent: string,
  accentSecondary?: string,
  overrides?: Partial<ThemeColors>
): AppTheme {
  return {
    id,
    name,
    emoji,
    cardTreatment,
    isLight: false,
    colors: {
      background: midnightCore.background,
      surface1: midnightCore.surface1,
      surface2: midnightCore.surface2,
      surface3: midnightCore.surface3,
      accent,
      accentSecondary,
      text: midnightCore.text,
      textPrimary: midnightCore.text,
      textSecondary: "#8b8ba8",
      border: midnightCore.border,
      tabBar: tabBar.background,
      success: semanticColors.success,
      warning: semanticColors.warning,
      danger: semanticColors.danger,
      ...overrides,
    },
  };
}

export const THEMES: Record<AppThemeId, AppTheme> = {
  midnight: darkTheme(
    "midnight",
    "Midnight",
    "🔵",
    "glass",
    themeAccents.midnight
  ),
  aurora: darkTheme("aurora", "Aurora", "🍃", "glass", themeAccents.aurora),
  ember: darkTheme("ember", "Ember", "🔥", "bordered", themeAccents.ember),
  sakura: darkTheme("sakura", "Sakura", "🌸", "bordered", themeAccents.sakura),
  ocean: darkTheme("ocean", "Ocean", "🌊", "glass", themeAccents.ocean),
  forest: darkTheme("forest", "Forest", "🌿", "bordered", themeAccents.forest),
  neonTokyo: darkTheme(
    "neonTokyo",
    "Neon Tokyo",
    "⚡",
    "neon",
    themeAccents.neonTokyo,
    themeAccents.neonTokyoSecondary
  ),
  parchment: {
    id: "parchment",
    name: "Parchment",
    emoji: "📜",
    cardTreatment: "paper",
    isLight: true,
    colors: {
      background: parchmentLight.previewBackground,
      surface1: parchmentLight.cardBackground,
      surface2: "#ebe3d6",
      surface3: "#e0d5c4",
      accent: themeAccents.parchment,
      text: parchmentLight.text,
      textPrimary: parchmentLight.text,
      textSecondary: parchmentLight.textSecondary,
      border: "#d4c4b0",
      tabBar: "#ebe3d6",
      success: semanticColors.success,
      warning: semanticColors.warning,
      danger: semanticColors.danger,
    },
  },
};

export const THEME_ORDER: AppThemeId[] = [
  "midnight",
  "aurora",
  "ember",
  "sakura",
  "ocean",
  "forest",
  "neonTokyo",
  "parchment",
];

export const DEFAULT_THEME_ID: AppThemeId = "midnight";

export function getTheme(id: AppThemeId): AppTheme {
  return THEMES[id] ?? THEMES.midnight;
}
