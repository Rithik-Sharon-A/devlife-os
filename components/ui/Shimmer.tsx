import { StyleSheet, View, type ViewStyle } from "react-native";

import { uiTheme } from "./theme";

interface ShimmerRowProps {
  style?: ViewStyle;
}

export function ShimmerRow({ style }: ShimmerRowProps) {
  return (
    <View style={[styles.row, style]} accessibilityLabel="Loading">
      <View style={styles.lineWide} />
      <View style={styles.lineNarrow} />
    </View>
  );
}

export function ShimmerList({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerRow key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingVertical: 8,
  },
  row: {
    backgroundColor: uiTheme.surface2,
    borderRadius: uiTheme.radiusInput,
    borderWidth: 1,
    borderColor: uiTheme.border,
    padding: 12,
    gap: 8,
    opacity: 0.6,
  },
  lineWide: {
    height: 12,
    borderRadius: 6,
    backgroundColor: uiTheme.surface3,
    width: "72%",
  },
  lineNarrow: {
    height: 10,
    borderRadius: 5,
    backgroundColor: uiTheme.surface3,
    width: "40%",
  },
});
