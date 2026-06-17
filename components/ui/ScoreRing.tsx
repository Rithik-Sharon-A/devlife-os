import { StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { RingProgress } from "./RingProgress";
import { uiTheme } from "./theme";

interface ScoreRingProps {
  score: number;
  size?: number;
}

function scoreColor(score: number): string {
  if (score < 40) return uiTheme.danger;
  if (score < 70) return uiTheme.warning;
  if (score < 90) return uiTheme.accent;
  return uiTheme.success;
}

export function ScoreRing({ score, size = 210 }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const progress = clamped / 100;
  const shared = useSharedValue(clamped);
  shared.value = withTiming(clamped, { duration: 450 });

  const scoreTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      shared.value,
      [0, 40, 70, 90, 100],
      [uiTheme.danger, uiTheme.warning, uiTheme.accent, uiTheme.success, uiTheme.success]
    ),
  }));

  return (
    <RingProgress
      size={size}
      progress={progress}
      color={scoreColor(clamped)}
      strokeWidth={14}
    >
      <View style={styles.center}>
        <Animated.Text style={[styles.score, scoreTextStyle]}>{Math.round(clamped)}</Animated.Text>
        <Text style={styles.label}>today</Text>
      </View>
    </RingProgress>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
  },
  score: {
    fontSize: 44,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    lineHeight: 48,
  },
  label: {
    marginTop: 2,
    color: uiTheme.textSecondary,
    fontSize: 13,
    textTransform: "lowercase",
  },
});
