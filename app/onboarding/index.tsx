import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { uiTheme } from "../../components/ui/theme";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { OnboardingShell } from "./components/OnboardingShell";
import { useOnboardingStep } from "./_layout";

const genderOptions = ["Male", "Female", "Other"] as const;

function genderFromLabel(label: string): "male" | "female" | "other" {
  if (label === "Female") return "female";
  if (label === "Other") return "other";
  return "male";
}

function labelFromGender(gender: "male" | "female" | "other"): string {
  if (gender === "female") return "Female";
  if (gender === "other") return "Other";
  return "Male";
}

export default function OnboardingIdentity() {
  const step = useOnboardingStep();
  const { name, age, gender, updateDraft } = useOnboardingStore();
  const [error, setError] = useState<string | null>(null);

  const selectedGender = useMemo(() => labelFromGender(gender), [gender]);

  const onNext = () => {
    const trimmedName = name.trim();
    const parsedAge = Number(age);

    if (trimmedName.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!parsedAge || parsedAge < 13 || parsedAge > 100) {
      setError("Please enter a valid age between 13 and 100.");
      return;
    }

    updateDraft({ name: trimmedName, age: String(parsedAge) });
    router.push("/onboarding/body");
  };

  return (
    <OnboardingShell
      step={step}
      showBack={false}
      footer={<Button label="Continue" onPress={onNext} />}
    >
      <Text style={styles.title}>Let's set up your DayOS</Text>
      <Text style={styles.subtitle}>
        Takes 2 minutes. Your data stays on your phone.
      </Text>

      <View style={styles.form}>
        <Input
          label="Full name"
          value={name}
          onChangeText={(text) => {
            setError(null);
            updateDraft({ name: text });
          }}
          placeholder="Arjun Sharma"
        />

        <Input
          label="Age"
          value={age}
          onChangeText={(text) => {
            setError(null);
            updateDraft({ age: text.replace(/[^0-9]/g, "") });
          }}
          placeholder="28"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Gender</Text>
        <SegmentedControl
          options={[...genderOptions]}
          selected={selectedGender}
          onChange={(option) => {
            setError(null);
            updateDraft({ gender: genderFromLabel(option) });
          }}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  title: {
    color: uiTheme.textPrimary,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 16,
    lineHeight: 38,
  },
  subtitle: {
    color: uiTheme.textSecondary,
    fontSize: 15,
    marginTop: 10,
    lineHeight: 22,
  },
  form: {
    marginTop: 28,
    gap: 16,
  },
  label: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: -8,
  },
  error: {
    color: uiTheme.danger,
    fontSize: 13,
    marginTop: 4,
  },
});
