import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { radii } from "../../utils/designTokens";
import { BounceButton } from "./MicroAnimations";

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
  const { theme } = useTheme();
  const { colors } = theme;
  const inactive = disabled || loading;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        base: {
          borderRadius: radii.md,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
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
          fontWeight: "600",
        },
        pressed: {
          transform: [{ scale: 0.98 }],
        },
        sm: {
          paddingVertical: 8,
          paddingHorizontal: 16,
        },
        md: {
          paddingVertical: 12,
          paddingHorizontal: 20,
        },
        lg: {
          paddingVertical: 16,
          paddingHorizontal: 28,
        },
        smText: { fontSize: 13 },
        mdText: { fontSize: 15 },
        lgText: { fontSize: 17 },
        primary: {
          backgroundColor: colors.accent,
        },
        primaryText: { color: "#ffffff" },
        primaryLoading: {
          backgroundColor: `${colors.accent}B3`,
        },
        secondary: {
          backgroundColor: colors.surface2,
          borderWidth: 1,
          borderColor: colors.border,
        },
        secondaryText: { color: colors.textPrimary },
        ghost: {
          backgroundColor: "transparent",
        },
        ghostText: { color: colors.accent },
        danger: {
          backgroundColor: colors.danger,
        },
        dangerText: { color: "#ffffff" },
        disabled: {
          backgroundColor: colors.surface3,
          opacity: 0.5,
        },
        disabledText: { color: colors.textSecondary },
      }),
    [colors]
  );

  const sizeStyle =
    size === "sm" ? styles.sm : size === "lg" ? styles.lg : styles.md;
  const sizeText =
    size === "sm" ? styles.smText : size === "lg" ? styles.lgText : styles.mdText;

  let containerStyle = styles.primary;
  let textStyle = styles.primaryText;

  if (disabled) {
    containerStyle = styles.disabled;
    textStyle = styles.disabledText;
  } else if (loading) {
    containerStyle = styles.primaryLoading;
    textStyle = styles.primaryText;
  } else if (variant === "secondary") {
    containerStyle = styles.secondary;
    textStyle = styles.secondaryText;
  } else if (variant === "ghost") {
    containerStyle = styles.ghost;
    textStyle = styles.ghostText;
  } else if (variant === "danger") {
    containerStyle = styles.danger;
    textStyle = styles.dangerText;
  }

  const displayLabel = loading ? "Loading..." : label;

  const content = loading ? (
    <View style={styles.contentRow}>
      <ActivityIndicator color="#ffffff" style={styles.icon} />
      <Text style={[styles.text, sizeText, textStyle]}>{displayLabel}</Text>
    </View>
  ) : (
    <View style={styles.contentRow}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.text, sizeText, textStyle]}>{label}</Text>
    </View>
  );

  const buttonFace = [styles.base, sizeStyle, containerStyle];

  if (variant === "primary" && !loading) {
    return (
      <BounceButton onPress={onPress} disabled={inactive}>
        <View style={buttonFace}>{content}</View>
      </BounceButton>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        ...buttonFace,
        pressed && !inactive && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}
