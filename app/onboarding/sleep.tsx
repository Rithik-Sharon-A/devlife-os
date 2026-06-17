import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/ui/Button";
import { uiTheme } from "../../components/ui/theme";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { OnboardingShell } from "./components/OnboardingShell";
import { TimePickerField } from "./components/TimePickerField";
import { useOnboardingStep } from "./_layout";

export default function OnboardingSleep() {
  const step = useOnboardingStep();
  const {
    wakeTime,
    sleepTime,
    workStartTime,
    enableReminders,
    updateDraft,
  } = useOnboardingStore();

  const onNext = () => {
    router.push("/onboarding/ai");
  };

  return (
    <OnboardingShell step={step} footer={<Button label="Continue" onPress={onNext} />}>
      <Text style={styles.title}>Daily routine</Text>
      <Text style={styles.subtitle}>Help DayOS know your schedule</Text>

      <View style={styles.form}>
        <TimePickerField
          label="Usual wake up time"
          value={wakeTime}
          onChange={(time) => updateDraft({ wakeTime: time })}
        />
        <TimePickerField
          label="Usual sleep time"
          value={sleepTime}
          onChange={(time) => updateDraft({ sleepTime: time })}
        />
        <TimePickerField
          label="Work/study start"
          value={workStartTime}
          onChange={(time) => updateDraft({ workStartTime: time })}
        />

        <View style={styles.toggleRow}>
          <View style={styles.toggleCopy}>
            <Text style={styles.toggleTitle}>Enable smart reminders?</Text>
            <Text style={styles.toggleSubtitle}>
              Water, meals, focus, and check-ins at the right times.
            </Text>
          </View>
          <View style={styles.toggleBtns}>
            <Pressable
              onPress={() => updateDraft({ enableReminders: true })}
              style={[styles.toggleBtn, enableReminders && styles.toggleBtnActive]}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  enableReminders && styles.toggleBtnTextActive,
                ]}
              >
                Yes
              </Text>
            </Pressable>
            <Pressable
              onPress={() => updateDraft({ enableReminders: false })}
              style={[styles.toggleBtn, !enableReminders && styles.toggleBtnActive]}
            >
              <Text
                style={[
                  styles.toggleBtnText,
                  !enableReminders && styles.toggleBtnTextActive,
                ]}
              >
                No
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  title: {
    color: uiTheme.textPrimary,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 12,
  },
  subtitle: {
    color: uiTheme.textSecondary,
    marginTop: 8,
    fontSize: 15,
  },
  form: {
    marginTop: 20,
    gap: 12,
  },
  toggleRow: {
    marginTop: 8,
    padding: 14,
    borderRadius: uiTheme.radiusCard,
    backgroundColor: uiTheme.surface2,
    borderWidth: 1,
    borderColor: uiTheme.border,
    gap: 12,
  },
  toggleCopy: {
    gap: 4,
  },
  toggleTitle: {
    color: uiTheme.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
  toggleSubtitle: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  toggleBtns: {
    flexDirection: "row",
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: uiTheme.radiusInput,
    borderWidth: 1,
    borderColor: uiTheme.border,
    alignItems: "center",
    backgroundColor: uiTheme.surface1,
  },
  toggleBtnActive: {
    borderColor: uiTheme.accent,
    backgroundColor: uiTheme.surface3,
  },
  toggleBtnText: {
    color: uiTheme.textSecondary,
    fontWeight: "600",
  },
  toggleBtnTextActive: {
    color: uiTheme.textPrimary,
  },
});
