import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { uiTheme } from "../ui/theme";

interface SessionDotsProps {
  total: number;
  completed: number;
  current?: number;
}

function Dot({
  state,
}: {
  state: "done" | "current" | "empty";
}) {
  const glow = useSharedValue(1);
  if (state === "current") {
    glow.value = withRepeat(withTiming(1.15, { duration: 700 }), -1, true);
  } else {
    glow.value = withTiming(1, { duration: 200 });
  }

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: glow.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        state === "done" && styles.done,
        state === "empty" && styles.empty,
        state === "current" && styles.current,
        animated,
      ]}
    />
  );
}

export function SessionDots({ total, completed, current = completed }: SessionDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => {
        const state =
          index < completed ? "done" : index === current ? "current" : "empty";
        return <Dot key={index} state={state} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: uiTheme.radiusPill,
  },
  done: {
    backgroundColor: uiTheme.success,
  },
  current: {
    backgroundColor: uiTheme.accent,
    shadowColor: uiTheme.accent,
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  empty: {
    backgroundColor: uiTheme.surface2,
    borderWidth: 1,
    borderColor: uiTheme.border,
  },
});
