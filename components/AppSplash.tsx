import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../context/ThemeContext";
import { radii, spacing } from "../utils/designTokens";
import { typography } from "../utils/typography";

interface AppSplashProps {
  visible: boolean;
  onHidden?: () => void;
}

export function AppSplash({ visible, onHidden }: AppSplashProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [mounted, setMounted] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(1);
      return;
    }

    Animated.timing(opacity, {
      toValue: 0,
      duration: 450,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setMounted(false);
        onHidden?.();
      }
    });
  }, [visible, onHidden, opacity]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity, backgroundColor: colors.background }]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View style={styles.row}>
        <View style={[styles.logoBox, { backgroundColor: colors.surface1 }]}>
          <Text style={[styles.logoIcon, { color: colors.accent }]}>▲</Text>
        </View>
        <View style={styles.wordmark}>
          <View style={styles.titleRow}>
            <Text style={[styles.day, { color: colors.textPrimary }]}>Day</Text>
            <Text style={[styles.os, { color: colors.accent }]}>OS</Text>
          </View>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Your private operating system for the day.
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  logoIcon: {
    fontSize: 28,
    fontWeight: "700",
  },
  wordmark: {
    flexShrink: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  day: {
    ...typography.display,
    fontSize: 32,
  },
  os: {
    ...typography.display,
    fontSize: 32,
  },
  tagline: {
    ...typography.body,
    maxWidth: 260,
    lineHeight: 22,
  },
});
