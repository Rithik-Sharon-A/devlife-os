import type { Habit } from "../types";

export const DEFAULT_HABIT_TEMPLATES: Array<
  Pick<Habit, "name" | "icon" | "color">
> = [
  { name: "Drink water goal", icon: "💧", color: "#60a5fa" },
  { name: "Exercise", icon: "🏃", color: "#34d399" },
  { name: "Read 20 minutes", icon: "📚", color: "#fbbf24" },
  { name: "Sleep before 11pm", icon: "😴", color: "#a78bfa" },
  { name: "No junk food", icon: "🥗", color: "#4ade80" },
  { name: "Meditate / breathe", icon: "🧘", color: "#7c6aff" },
];

export const HABIT_EMOJI_OPTIONS = [
  "💧",
  "🏃",
  "📚",
  "😴",
  "🥗",
  "🧘",
  "🎯",
  "💪",
  "🧠",
  "☀️",
  "🚶",
  "🍎",
  "✍️",
  "🎵",
  "🧹",
  "💊",
  "🌿",
  "📵",
  "🙏",
  "❤️",
];

export const HABIT_COLOR_OPTIONS = [
  "#7c6aff",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
  "#f472b6",
  "#f87171",
];
