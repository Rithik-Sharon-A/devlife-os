import { Pressable, StyleSheet, Text, View } from "react-native";

import type { MoodRating } from "../../types";
import { uiTheme } from "./theme";

const moodMap: Record<MoodRating, string> = {
  1: "😴",
  2: "😐",
  3: "🙂",
  4: "😊",
  5: "🤩",
};

interface MoodSelectorProps {
  value?: MoodRating;
  onChange: (rating: MoodRating) => void;
  label: string;
}

export function MoodSelector({ value, onChange, label }: MoodSelectorProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {([1, 2, 3, 4, 5] as MoodRating[]).map((rating) => {
          const active = value === rating;

          return (
            <Pressable
              key={rating}
              style={[styles.dot, active && styles.dotActive]}
              onPress={() => onChange(rating)}
            >
              <Text style={styles.emoji}>{moodMap[rating]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  dot: {
    flex: 1,
    borderRadius: uiTheme.radiusInput,
    borderWidth: 1,
    borderColor: uiTheme.border,
    backgroundColor: uiTheme.surface2,
    alignItems: "center",
    paddingVertical: 10,
  },
  dotActive: {
    borderColor: uiTheme.accent,
    backgroundColor: uiTheme.surface3,
  },
  emoji: {
    fontSize: 24,
  },
});
