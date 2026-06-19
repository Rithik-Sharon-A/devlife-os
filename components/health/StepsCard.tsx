import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface StepsCardProps {
  steps: number;
  goal: number;
  percentage: number;
  isTracking: boolean;
  isAvailable: boolean;
  isLoading: boolean;
  onPress?: () => void;
}

export default function StepsCard({
  steps,
  goal,
  percentage,
  isTracking,
  isAvailable,
  isLoading,
  onPress,
}: StepsCardProps) {
  const getMotivation = () => {
    if (isLoading) return "Loading...";
    if (!isAvailable) return "Sensor unavailable";
    if (steps === 0) return "Start walking! 🚶";
    if (percentage >= 100) return "Goal crushed! 🎉";
    if (percentage >= 75) return "Almost there! 💪";
    if (percentage >= 50) return "Halfway! Keep going";
    if (percentage >= 25) return "Good start! 🏃";
    return `${(goal - steps).toLocaleString()} to go`;
  };

  const getColor = () => {
    if (percentage >= 100) return "#34d399";
    if (percentage >= 50) return "#7c6aff";
    return "#0ea5e9";
  };

  const fillWidth = Math.min(100, percentage);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.topRow}>
        <Text style={styles.icon}>👟</Text>
        <View style={styles.rightTop}>
          {isTracking && isAvailable ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : null}
        </View>
      </View>

      {steps === 0 ? (
        <>
          <Text style={styles.goalValue}>{goal.toLocaleString()}</Text>
          <Text style={styles.label}>STEP GOAL</Text>
          <Text style={styles.zeroHint}>0 steps · start moving</Text>
        </>
      ) : (
        <>
          <Text style={[styles.value, { color: getColor() }]}>
            {steps.toLocaleString()}
          </Text>
          <Text style={styles.label}>STEPS</Text>
        </>
      )}

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${fillWidth}%`,
              backgroundColor: getColor(),
              minWidth: fillWidth > 0 ? 4 : 0,
            },
          ]}
        />
      </View>

      <Text style={styles.motivation}>{getMotivation()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1a24",
    borderRadius: 16,
    padding: 14,
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  icon: {
    fontSize: 20,
  },
  rightTop: {
    alignItems: "flex-end",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(52,211,153,0.12)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.25)",
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#34d399",
  },
  liveText: {
    fontSize: 9,
    color: "#34d399",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 26,
    fontWeight: "700",
    color: "#f0f0ff",
    fontVariant: ["tabular-nums"],
  },
  goalValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#3a3a4a",
    fontVariant: ["tabular-nums"],
  },
  label: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  zeroHint: {
    fontSize: 10,
    color: "#4a4a5a",
    marginBottom: 8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: "#2a2a3a",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  motivation: {
    fontSize: 10,
    color: "#6b7280",
  },
});
