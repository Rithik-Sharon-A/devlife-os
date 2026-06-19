/** cAI brand design tokens — single source of truth for raw values. */

export const midnightCore = {
  background: "#0a0a0f",
  surface1: "#13131a",
  surface2: "#1a1a24",
  surface3: "#22222e",
  accent: "#7c6aff",
  text: "#f0f0ff",
  border: "#2a2a3a",
} as const;

export const semanticColors = {
  success: "#34d399",
  warning: "#fbbf24",
  danger: "#f87171",
} as const;

export const semanticLabels = {
  success: "on track ✓",
  warning: "heads up △",
  danger: "over goal ✗",
} as const;

export const themeAccents = {
  midnight: "#7c6aff",
  aurora: "#00d4aa",
  ember: "#ff6b2b",
  sakura: "#ff6eb4",
  ocean: "#0ea5e9",
  forest: "#4ade80",
  neonTokyo: "#ff00ff",
  neonTokyoSecondary: "#00ffff",
  parchment: "#8b5e3c",
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

export const tabBar = {
  background: "#0f0f16",
} as const;

/** Parchment light-surface tokens */
export const parchmentLight = {
  cardBackground: "#f5efe6",
  previewBackground: "#faf6f0",
  text: "#2c1810",
  textSecondary: "#6b5344",
} as const;
