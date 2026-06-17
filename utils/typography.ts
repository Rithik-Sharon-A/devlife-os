import type { TextStyle } from "react-native";

export const typography = {
  display: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 28,
    fontWeight: "700",
  },
  h2: {
    fontSize: 22,
    fontWeight: "600",
  },
  h3: {
    fontSize: 18,
    fontWeight: "600",
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: "400",
  },
  caption: {
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  mono: {
    fontSize: 32,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  monoLarge: {
    fontSize: 28,
    fontFamily: "monospace",
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
