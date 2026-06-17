import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { uiTheme } from "./theme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
}: ButtonProps) {
  const inactive = disabled || loading;
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        sizeStyle.container,
        variantStyle.container,
        inactive && styles.disabled,
        pressed && !inactive && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color} />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}
          <Text style={[styles.text, sizeStyle.text, variantStyle.text]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const sizeStyles = {
  sm: StyleSheet.create({
    container: { minHeight: 36, paddingHorizontal: 12 },
    text: { fontSize: 13 },
  }),
  md: StyleSheet.create({
    container: { minHeight: 44, paddingHorizontal: 16 },
    text: { fontSize: 15 },
  }),
  lg: StyleSheet.create({
    container: { minHeight: 52, paddingHorizontal: 20 },
    text: { fontSize: 16 },
  }),
} as const;

const variantStyles = {
  primary: StyleSheet.create({
    container: { backgroundColor: uiTheme.accent },
    text: { color: uiTheme.textPrimary },
  }),
  secondary: StyleSheet.create({
    container: { backgroundColor: uiTheme.surface2, borderWidth: 1, borderColor: uiTheme.border },
    text: { color: uiTheme.textPrimary },
  }),
  ghost: StyleSheet.create({
    container: { backgroundColor: "transparent", borderWidth: 1, borderColor: uiTheme.border },
    text: { color: uiTheme.textSecondary },
  }),
  danger: StyleSheet.create({
    container: { backgroundColor: uiTheme.danger },
    text: { color: "#1a1111" },
  }),
} as const;

const styles = StyleSheet.create({
  base: {
    borderRadius: uiTheme.radiusInput,
    alignItems: "center",
    justifyContent: "center",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
