import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { formatClock } from "../../utils/date";
import { RingProgress } from "../ui/RingProgress";
import { uiTheme } from "../ui/theme";

interface FocusRingProps {
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  sessionLabel?: string;
}

export function FocusRing({
  secondsLeft,
  totalSeconds,
  isRunning,
  sessionLabel,
}: FocusRingProps) {
  const progress = Math.max(0, Math.min(1, 1 - secondsLeft / Math.max(1, totalSeconds)));
  const pulse = useSharedValue(1);

  if (isRunning) {
    pulse.value = withRepeat(withTiming(1.04, { duration: 900 }), -1, true);
  } else {
    pulse.value = withTiming(1, { duration: 180 });
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, animatedStyle]}>
      <RingProgress size={280} progress={progress} color={uiTheme.accent} strokeWidth={16}>
        <View style={styles.center}>
          <Text style={styles.time}>{formatClock(secondsLeft)}</Text>
          <Text style={styles.sub}>
            {sessionLabel ?? (isRunning ? "Focus mode" : "Paused")}
          </Text>
        </View>
      </RingProgress>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    shadowColor: uiTheme.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 7,
  },
  center: {
    alignItems: "center",
  },
  time: {
    color: uiTheme.textPrimary,
    fontSize: 40,
    fontWeight: "800",
    fontFamily: "monospace",
    fontVariant: ["tabular-nums"],
    letterSpacing: 1,
  },
  sub: {
    color: uiTheme.textSecondary,
    marginTop: 4,
  },
});
