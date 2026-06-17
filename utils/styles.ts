import { Platform } from "react-native";

export const shadows = {
  small: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    web: { boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    web: { boxShadow: "0 4px 8px rgba(0,0,0,0.15)" },
  }),
  large: Platform.select({
    ios: {
      shadowColor: "#7c6aff",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    web: { boxShadow: "0 8px 16px rgba(124,106,255,0.3)" },
  }),
  fab: Platform.select({
    ios: {
      shadowColor: "#7c6aff",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.45,
      shadowRadius: 10,
    },
    android: { elevation: 8 },
    web: { boxShadow: "0 4px 10px rgba(124,106,255,0.45)" },
  }),
  toast: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    web: { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  }),
} as const;
