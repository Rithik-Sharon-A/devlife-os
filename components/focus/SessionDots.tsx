import { Platform, StyleSheet, View } from "react-native";

import { uiTheme } from "../ui/theme";

interface SessionDotsProps {
  total: number;
  completed: number;
  current?: number;
}

function Dot({
  state,
}: {
  state: "done" | "current" | "empty";
}) {
  return (
    <View
      style={[
        styles.dot,
        state === "done" && styles.done,
        state === "empty" && styles.empty,
        state === "current" && styles.current,
      ]}
    />
  );
}

export function SessionDots({ total, completed, current = completed }: SessionDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => {
        const state =
          index < completed ? "done" : index === current ? "current" : "empty";
        return <Dot key={index} state={state} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: uiTheme.radiusPill,
  },
  done: {
    backgroundColor: uiTheme.success,
  },
  current: {
    backgroundColor: uiTheme.accent,
    ...Platform.select({
      ios: {
        shadowColor: uiTheme.accent,
        shadowOpacity: 0.6,
        shadowRadius: 6,
      },
      android: {},
      web: { boxShadow: `0 0 6px ${uiTheme.accent}99` },
    }),
  },
  empty: {
    backgroundColor: uiTheme.surface2,
    borderWidth: 1,
    borderColor: uiTheme.border,
  },
});
