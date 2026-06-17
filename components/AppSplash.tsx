import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";

interface AppSplashProps {
  visible: boolean;
  onHidden?: () => void;
}

export function AppSplash({ visible, onHidden }: AppSplashProps) {
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
      style={[styles.container, { opacity }]}
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
