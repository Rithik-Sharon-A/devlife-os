import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { useAppStore } from "../../store/useAppStore";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { MoodSelector } from "../ui/MoodSelector";
import { uiTheme } from "../ui/theme";
import type { MoodRating, QualityRating } from "../../types";

function durationHours(bed: string, wake: string): number {
  const [bh, bm] = bed.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  if ([bh, bm, wh, wm].some((v) => Number.isNaN(v))) return 0;
  let start = bh * 60 + bm;
  let end = wh * 60 + wm;
  if (end < start) end += 24 * 60;
  return Math.round(((end - start) / 60) * 10) / 10;
}

export function SleepLogger() {
  const logSleep = useAppStore((s) => s.logSleep);
  const [bedTime, setBedTime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState<QualityRating>(3);
  const [notes, setNotes] = useState("");
  const duration = useMemo(() => durationHours(bedTime, wakeTime), [bedTime, wakeTime]);

  const save = () => {
    logSleep({
      date: new Date().toISOString().slice(0, 10),
      bedTime,
      wakeTime,
      durationHours: duration,
      qualityRating: quality,
      notes: notes || undefined,
    });
  };

  return (
    <Card variant="bordered">
      <Text style={styles.title}>Sleep logger</Text>

      <View style={styles.row}>
        <TextInput
          value={bedTime}
          onChangeText={setBedTime}
          style={styles.input}
          placeholder="23:00"
          placeholderTextColor={uiTheme.textSecondary}
        />
        <TextInput
          value={wakeTime}
          onChangeText={setWakeTime}
          style={styles.input}
          placeholder="07:00"
          placeholderTextColor={uiTheme.textSecondary}
        />
      </View>
      <Text style={styles.duration}>Duration: {duration}h</Text>

      <Text style={styles.label}>Quality</Text>
      <MoodSelector
        label="How did you sleep?"
        value={quality as MoodRating}
        onChange={(rating) => setQuality(rating as QualityRating)}
      />

      <TextInput
        value={notes}
        onChangeText={setNotes}
        style={[styles.input, styles.notes]}
        placeholder="Notes (optional)"
        placeholderTextColor={uiTheme.textSecondary}
        multiline
      />

      <Button label="Save sleep log" onPress={save} />
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
  row: {
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusInput,
    backgroundColor: uiTheme.surface2,
    color: uiTheme.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontVariant: ["tabular-nums"],
  },
  duration: {
    color: uiTheme.textPrimary,
    marginTop: 8,
    marginBottom: 10,
    fontVariant: ["tabular-nums"],
  },
  label: {
    color: uiTheme.textSecondary,
    marginBottom: 6,
  },
  notes: {
    marginVertical: 10,
    minHeight: 76,
    textAlignVertical: "top",
  },
});
