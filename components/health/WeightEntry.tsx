import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAppStore } from "../../store/useAppStore";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { uiTheme } from "../ui/theme";

type Unit = "kg" | "lbs";

function lbsToKg(v: number): number {
  return v / 2.20462;
}

function kgToLbs(v: number): number {
  return v * 2.20462;
}

export function WeightEntry() {
  const latest = useAppStore((s) => s.bodyMetrics[0] ?? null);
  const logWeight = useAppStore((s) => s.logWeight);

  const [unit, setUnit] = useState<Unit>("kg");
  const [value, setValue] = useState("");

  const parsed = Number(value);
  const kgValue =
    Number.isNaN(parsed) || parsed <= 0
      ? 0
      : unit === "kg"
        ? parsed
        : lbsToKg(parsed);

  const diff = useMemo(() => {
    if (!latest || !kgValue) return 0;
    return Math.round((kgValue - latest.weightKg) * 10) / 10;
  }, [kgValue, latest]);

  const message =
    diff < 0
      ? "Great consistency. Keep this trend going."
      : diff > 0
        ? "Small fluctuations are normal. Stay consistent."
        : "Steady today. Consistency wins.";

  const save = () => {
    if (!kgValue) return;
    logWeight(Math.round(kgValue * 10) / 10);
    setValue("");
  };

  return (
    <Card variant="bordered">
      <Text style={styles.title}>Weight entry</Text>
      <View style={styles.toggleRow}>
        {(["kg", "lbs"] as Unit[]).map((u) => (
          <Pressable
            key={u}
            onPress={() => setUnit(u)}
            style={[styles.toggle, unit === u && styles.toggleActive]}
          >
            <Text style={[styles.toggleText, unit === u && styles.toggleTextActive]}>{u}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={value}
        onChangeText={setValue}
        keyboardType="decimal-pad"
        placeholder={`Enter weight (${unit})`}
        placeholderTextColor={uiTheme.textSecondary}
        style={styles.input}
      />

      {latest ? (
        <Text style={styles.delta}>
          Change from last: {diff > 0 ? "+" : ""}{diff} kg
        </Text>
      ) : null}
      <Text style={styles.message}>{message}</Text>

      <Button label="Save weight" onPress={save} />
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: uiTheme.textPrimary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  toggle: {
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusPill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: uiTheme.surface2,
  },
  toggleActive: {
    borderColor: uiTheme.accent,
    backgroundColor: uiTheme.surface3,
  },
  toggleText: {
    color: uiTheme.textSecondary,
    fontWeight: "600",
  },
  toggleTextActive: {
    color: uiTheme.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusInput,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: uiTheme.surface2,
    color: uiTheme.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  delta: {
    marginTop: 8,
    color: uiTheme.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  message: {
    marginTop: 4,
    marginBottom: 10,
    color: uiTheme.textSecondary,
  },
});
