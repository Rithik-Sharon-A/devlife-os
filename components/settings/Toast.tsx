import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

import { uiTheme } from "../ui/theme";

interface ToastProps {
  message: string | null;
  onHide?: () => void;
}

export function Toast({ message, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      return;
    }

    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      onHide?.();
    }, 2200);

    return () => clearTimeout(timer);
  }, [message, onHide, opacity]);

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 28,
    left: 20,
    right: 20,
    backgroundColor: uiTheme.surface3,
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusInput,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    zIndex: 100,
  },
  text: {
    color: uiTheme.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
});
