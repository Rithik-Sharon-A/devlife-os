import { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { uiTheme } from "../ui/theme";

interface ToastProps {
  message: string | null;
  onHide?: () => void;
}

export function Toast({ message, onHide }: ToastProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!message) {
      opacity.value = withTiming(0, { duration: 200 });
      return;
    }

    opacity.value = withTiming(1, { duration: 200 });
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 200 });
      onHide?.();
    }, 2200);

    return () => clearTimeout(timer);
  }, [message, onHide, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, style]} pointerEvents="none">
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
