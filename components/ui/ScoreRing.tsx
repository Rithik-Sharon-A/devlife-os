import { StyleSheet, Text, View } from "react-native";

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
  const color = scoreColor(clamped);

  return (
    <RingProgress
      size={size}
      progress={progress}
      color={color}
      strokeWidth={14}
    >
      <View style={styles.center}>
        <Text style={[styles.score, { color }]}>{Math.round(clamped)}</Text>
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
