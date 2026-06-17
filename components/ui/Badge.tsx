import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { uiTheme } from "./theme";

interface BadgeProps {
  label: string;
  color?: string;
  icon?: ReactNode;
}

export function Badge({ label, color = uiTheme.accent, icon }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22`, borderColor: `${color}66` }]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: uiTheme.radiusPill,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
