import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useAppStore } from "../../store/useAppStore";
import type { ExerciseType, IntensityLevel } from "../../types";
import { calculateCaloriesBurned } from "../../utils/tdee";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { uiTheme } from "../ui/theme";

const exercises: Array<{ type: ExerciseType; label: string; icon: string }> = [
  { type: "walk", label: "Walk", icon: "🚶" },
  { type: "run", label: "Run", icon: "🏃" },
  { type: "gym", label: "Gym", icon: "🏋️" },
  { type: "yoga", label: "Yoga", icon: "🧘" },
  { type: "cycling", label: "Cycle", icon: "🚴" },
  { type: "swimming", label: "Swim", icon: "🏊" },
  { type: "home_workout", label: "Home", icon: "💪" },
  { type: "sports", label: "Sports", icon: "⚽" },
];

const intensityLevels: IntensityLevel[] = ["light", "moderate", "intense"];
const durationMarks = [15, 30, 45, 60, 75, 90];

export function WorkoutLogger() {
  const profile = useAppStore((s) => s.profile);
  const addWorkout = useAppStore((s) => s.addWorkout);
  const [exerciseType, setExerciseType] = useState<ExerciseType>("walk");
  const [duration, setDuration] = useState(30);
  const [manualDuration, setManualDuration] = useState("30");
  const [intensity, setIntensity] = useState<IntensityLevel>("moderate");

  const calories = useMemo(() => {
    return calculateCaloriesBurned(
      exerciseType,
      duration,
      profile?.weightKg ?? 65,
      intensity
    );
  }, [duration, exerciseType, intensity, profile?.weightKg]);

  const save = () => {
    addWorkout({
      date: new Date().toISOString().slice(0, 10),
      exerciseType,
      durationMinutes: duration,
      intensityLevel: intensity,
      caloriesBurned: calories,
    });
  };

  return (
    <Card variant="bordered">
      <Text style={styles.title}>Workout logger</Text>
      <View style={styles.grid}>
        {exercises.map((exercise) => {
          const active = exercise.type === exerciseType;
          return (
            <Pressable
              key={exercise.type}
              style={[styles.exercise, active && styles.exerciseActive]}
              onPress={() => setExerciseType(exercise.type)}
            >
              <Text style={styles.icon}>{exercise.icon}</Text>
              <Text style={styles.label}>{exercise.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.section}>Duration</Text>
      <View style={styles.rowWrap}>
        {durationMarks.map((mark) => (
          <Button
            key={mark}
            label={`${mark}m`}
            size="sm"
            variant={duration === mark ? "primary" : "secondary"}
            onPress={() => {
              setDuration(mark);
              setManualDuration(String(mark));
            }}
          />
        ))}
      </View>
      <TextInput
        value={manualDuration}
        onChangeText={(v) => {
          setManualDuration(v);
          const parsed = Number(v);
          if (!Number.isNaN(parsed) && parsed > 0) setDuration(parsed);
        }}
        keyboardType="number-pad"
        style={styles.input}
        placeholder="Custom minutes"
        placeholderTextColor={uiTheme.textSecondary}
      />

      <Text style={styles.section}>Intensity</Text>
      <View style={styles.rowWrap}>
        {intensityLevels.map((lvl) => (
          <Button
            key={lvl}
            label={lvl[0].toUpperCase() + lvl.slice(1)}
            size="sm"
            variant={intensity === lvl ? "primary" : "secondary"}
            onPress={() => setIntensity(lvl)}
          />
        ))}
      </View>

      <Text style={styles.kcal}>Estimated burn: {calories} kcal</Text>
      <Button label="Save workout" onPress={save} />
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  exercise: {
    width: "23%",
    minWidth: 72,
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusInput,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: uiTheme.surface2,
  },
  exerciseActive: {
    borderColor: uiTheme.accent,
    backgroundColor: uiTheme.surface3,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    color: uiTheme.textPrimary,
  },
  section: {
    color: uiTheme.textSecondary,
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "600",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusInput,
    backgroundColor: uiTheme.surface2,
    color: uiTheme.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  kcal: {
    marginVertical: 12,
    color: uiTheme.textPrimary,
    fontVariant: ["tabular-nums"],
  },
});
