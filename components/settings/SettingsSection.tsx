import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

const colors = {
  card: "#13131a",
  separator: "#1e1e28",
  primary: "#e2e8f0",
  secondary: "#6b7280",
  chevron: "#4a4a5a",
  accent: "#7c6aff",
};

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
  right?: ReactNode;
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
      <View style={styles.rowRight}>
        {right ?? (value ? <Text style={styles.value}>{value}</Text> : null)}
        {onPress ? <Text style={styles.chevron}>›</Text> : null}
      </View>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
    </Pressable>
  );
}

export function SettingsToggle({
  label,
  enabled,
  onToggle,
  isLast,
}: {
  label: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        thumbColor="#ffffff"
        trackColor={{ false: "#2a2a3a", true: colors.accent }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginHorizontal: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.separator,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    justifyContent: "flex-end",
  },
  label: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "400",
    flex: 1,
  },
  value: {
    fontSize: 15,
    color: colors.secondary,
    fontVariant: ["tabular-nums"],
    flexShrink: 1,
    textAlign: "right",
  },
  chevron: {
    fontSize: 18,
    color: colors.chevron,
    lineHeight: 18,
  },
});
