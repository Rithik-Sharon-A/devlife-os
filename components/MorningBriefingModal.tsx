import { Modal, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppStore } from "../store/useAppStore";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { uiTheme } from "./ui/theme";

interface MorningBriefingModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export function MorningBriefingModal({ visible, onDismiss }: MorningBriefingModalProps) {
  const profile = useAppStore((s) => s.profile);
  const waterConfig = useAppStore((s) => s.waterConfig);
  const habits = useAppStore((s) => s.habits);

  const activeHabits = habits.filter((h) => h.isActive).length;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safe}>
          <Card variant="elevated" style={styles.card}>
            <Text style={styles.greeting} maxFontSizeMultiplier={1.3}>
              Good morning{profile?.name ? `, ${profile.name}` : ""} ☀️
            </Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={1.3}>
              Here is your plan for today.
            </Text>

            <View style={styles.stats}>
              <Stat label="Calorie goal" value={`${profile?.dailyCalorieGoal.toLocaleString() ?? "—"} kcal`} />
              <Stat
                label="Water goal"
                value={`${waterConfig.dailyGoalBottles} × ${waterConfig.bottleSizeMl}ml`}
              />
              <Stat label="Habits to track" value={String(activeHabits)} />
            </View>

            <Text style={styles.tip} maxFontSizeMultiplier={1.3}>
              Log breakfast, check your mood, and knock out your first habit before noon.
            </Text>

            <Button label="Let's go →" onPress={onDismiss} />
          </Card>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
      <Text style={styles.statValue} maxFontSizeMultiplier={1.3}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    padding: 20,
  },
  safe: {
    width: "100%",
  },
  card: {
    gap: 14,
    padding: 20,
  },
  greeting: {
    color: uiTheme.textPrimary,
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: uiTheme.textSecondary,
    fontSize: 15,
  },
  stats: {
    gap: 10,
    marginTop: 4,
  },
  stat: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.border,
    paddingBottom: 8,
  },
  statLabel: {
    color: uiTheme.textSecondary,
    fontSize: 14,
  },
  statValue: {
    color: uiTheme.accent,
    fontWeight: "700",
    fontSize: 14,
  },
  tip: {
    color: uiTheme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
