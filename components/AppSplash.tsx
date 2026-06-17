import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface AppSplashProps {
  visible: boolean;
  onHidden?: () => void;
}

export function AppSplash({ visible, onHidden }: AppSplashProps) {
  const [mounted, setMounted] = useState(true);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      opacity.value = 1;
      return;
    }

    opacity.value = withTiming(0, { duration: 450 }, (finished) => {
      if (finished) {
        runOnJS(setMounted)(false);
        if (onHidden) runOnJS(onHidden)();
      }
    });
  }, [visible, onHidden, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!mounted) return null;

  return (
    <Animated.View
      style={[styles.container, style]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <Text style={styles.title}>DayOS</Text>
      <Text style={styles.subtitle}>Your daily companion</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0d0f12",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  },
  title: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: 1,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "500",
  },
});
