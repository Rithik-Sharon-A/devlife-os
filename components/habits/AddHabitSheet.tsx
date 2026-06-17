import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  HABIT_COLOR_OPTIONS,
  HABIT_EMOJI_OPTIONS,
} from "../../data/defaultHabits";
import type { Habit } from "../../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { uiTheme } from "../ui/theme";

interface AddHabitSheetProps {
  initial?: Pick<Habit, "name" | "icon" | "color">;
  onSave: (habit: Pick<Habit, "name" | "icon" | "color" | "isActive">) => void;
}

export function AddHabitSheet({
  initial,
  onSave,
}: AddHabitSheetProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? HABIT_EMOJI_OPTIONS[0]);
  const [color, setColor] = useState(
    initial?.color ?? HABIT_COLOR_OPTIONS[0]
  );

  useEffect(() => {
    setName(initial?.name ?? "");
    setIcon(initial?.icon ?? HABIT_EMOJI_OPTIONS[0]);
    setColor(initial?.color ?? HABIT_COLOR_OPTIONS[0]);
  }, [initial]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, icon, color, isActive: true });
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Input
        label="Habit name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Morning stretch"
      />

      <Text style={styles.label}>Icon</Text>
      <View style={styles.emojiGrid}>
        {HABIT_EMOJI_OPTIONS.map((emoji) => (
          <Pressable
            key={emoji}
            onPress={() => setIcon(emoji)}
            style={[styles.emojiCell, icon === emoji && styles.emojiCellActive]}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Color</Text>
      <View style={styles.colorRow}>
        {HABIT_COLOR_OPTIONS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.colorSwatch,
              { backgroundColor: c },
              color === c && styles.colorSwatchActive,
            ]}
          />
        ))}
      </View>

      <Button label="Save habit" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiCell: {
    width: 44,
    height: 44,
    borderRadius: uiTheme.radiusInput,
    borderWidth: 1,
    borderColor: uiTheme.border,
    backgroundColor: uiTheme.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiCellActive: {
    borderColor: uiTheme.accent,
    backgroundColor: uiTheme.surface3,
  },
  emoji: {
    fontSize: 22,
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchActive: {
    borderColor: uiTheme.textPrimary,
  },
});
