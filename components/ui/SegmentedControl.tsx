import { Pressable, StyleSheet, Text, View } from "react-native";

import { uiTheme } from "./theme";

interface SegmentedControlProps {
  options: string[];
  selected: string;
  onChange: (next: string) => void;
}

export function SegmentedControl({
  options,
  selected,
  onChange,
}: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: uiTheme.surface2,
    borderRadius: uiTheme.radiusPill,
    borderWidth: 1,
    borderColor: uiTheme.border,
    padding: 4,
  },
  segment: {
    flex: 1,
    borderRadius: uiTheme.radiusPill,
    paddingVertical: 8,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: uiTheme.surface3,
  },
  text: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  textActive: {
    color: uiTheme.textPrimary,
  },
});
