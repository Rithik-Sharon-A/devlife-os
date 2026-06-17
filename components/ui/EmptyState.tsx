import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { uiTheme } from "./theme";

interface EmptyStateProps {
  message: string;
  icon?: string;
  action?: ReactNode;
}

export function EmptyState({ message, icon, action }: EmptyStateProps) {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      {icon ? (
        <Text style={styles.icon} accessibilityLabel={icon} accessibilityHint="Empty state icon">
          {icon}
        </Text>
      ) : null}
      <Text style={styles.message} maxFontSizeMultiplier={1.4}>
        {message}
      </Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 12,
    gap: 8,
  },
  icon: {
    fontSize: 28,
  },
  message: {
    color: uiTheme.textSecondary,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  action: {
    marginTop: 4,
  },
});
