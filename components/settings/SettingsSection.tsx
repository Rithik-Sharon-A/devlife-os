import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { uiTheme } from "../ui/theme";

export function SettingsSection({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  isLast?: boolean;
}

export function SettingsRow({
  label,
  value,
  onPress,
  right,
  isLast,
}: SettingsRowProps) {
  const content = (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.label}>{label}</Text>
      {right ?? (value ? <Text style={styles.value}>{value}</Text> : null)}
    </View>
  );

  if (!onPress) return content;

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

export function SettingsToggle({
  label,
  enabled,
  onToggle,
  isLast,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.row, !isLast && styles.rowBorder]}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.toggle, enabled && styles.toggleOn]}>
        <Text style={styles.toggleText}>{enabled ? "On" : "Off"}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  title: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: uiTheme.surface1,
    borderRadius: uiTheme.radiusCard,
    borderWidth: 1,
    borderColor: uiTheme.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.border,
  },
  label: {
    color: uiTheme.textPrimary,
    fontSize: 15,
    flex: 1,
  },
  value: {
    color: uiTheme.accent,
    fontWeight: "600",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  toggle: {
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusPill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: uiTheme.surface2,
  },
  toggleOn: {
    borderColor: uiTheme.success,
    backgroundColor: `${uiTheme.success}22`,
  },
  toggleText: {
    color: uiTheme.textPrimary,
    fontWeight: "700",
    fontSize: 12,
  },
});
