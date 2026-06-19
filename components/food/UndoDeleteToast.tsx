import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { uiTheme } from "../ui/theme";

interface UndoDeleteToastProps {
  visible: boolean;
  foodName: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoDeleteToast({
  visible,
  foodName,
  onUndo,
  onDismiss,
}: UndoDeleteToastProps) {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 80,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 80,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onDismiss();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [visible, foodName, onDismiss, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.wrap,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <View style={styles.toast}>
        <Text style={styles.message} numberOfLines={1}>
          Removed {foodName}
        </Text>
        <Pressable onPress={onUndo} hitSlop={8}>
          <Text style={styles.undo}>Undo</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 100,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: "#1e232b",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 13,
    color: uiTheme.textPrimary,
  },
  undo: {
    fontSize: 13,
    fontWeight: "600",
    color: uiTheme.accent,
  },
});
