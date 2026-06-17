import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { radii } from "../../utils/designTokens";

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
  const { theme } = useTheme();
  const { colors } = theme;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flexDirection: "row",
          backgroundColor: colors.surface2,
          borderRadius: radii.pill,
          padding: 3,
        },
        segment: {
          flex: 1,
          borderRadius: radii.pill,
          paddingVertical: 8,
          alignItems: "center",
        },
        segmentActive: {
          backgroundColor: colors.accent,
        },
        text: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: "600",
        },
        textActive: {
          color: "#ffffff",
          fontWeight: "600",
        },
      }),
    [colors]
  );

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
