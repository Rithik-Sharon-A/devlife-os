import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { uiTheme } from "../ui/theme";

interface CalorieBarProps {
  consumed: number;
  goal: number;
}

function colorFor(consumed: number, goal: number): string {
  if (consumed > goal) return uiTheme.danger;
  if (consumed >= goal * 0.85) return uiTheme.warning;
  return uiTheme.success;
}

export function CalorieBar({ consumed, goal }: CalorieBarProps) {
  const safeGoal = Math.max(1, goal);
  const remaining = Math.max(0, goal - consumed);
  const ratio = Math.min(1, consumed / safeGoal);
  const animated = useSharedValue(ratio);
  animated.value = withTiming(ratio, { duration: 400 });

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animated.value * 100}%`,
  }));

  return (
    <View>
      <View style={styles.textRow}>
        <Text style={styles.meta}>Consumed {consumed} kcal</Text>
        <Text style={styles.meta}>Remaining {remaining} kcal</Text>
        <Text style={styles.meta}>Goal {goal} kcal</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, fillStyle, { backgroundColor: colorFor(consumed, goal) }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  textRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  meta: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  track: {
    height: 10,
    borderRadius: uiTheme.radiusPill,
    overflow: "hidden",
    backgroundColor: uiTheme.surface3,
  },
  fill: {
    height: "100%",
    borderRadius: uiTheme.radiusPill,
  },
});
