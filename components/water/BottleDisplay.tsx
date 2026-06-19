import { Platform, Pressable, StyleSheet, View } from "react-native";

import { uiTheme } from "../ui/theme";
import { BottleSvg } from "./WaterBottle";

interface BottleDisplayProps {
  consumedBottles: number;
  goalBottles: number;
  bottleSizeMl?: number;
  onBottlePress?: (index: number) => void;
  size?: "md" | "lg";
}

function bottleFillAtIndex(consumed: number, index: number): number {
  const remaining = consumed - index;
  return Math.max(0, Math.min(1, remaining));
}

const SIZES = {
  md: { width: 36, height: 64 },
  lg: { width: 52, height: 88 },
} as const;

function BottleIcon({
  fill,
  onPress,
  size,
}: {
  fill: number;
  onPress?: () => void;
  size: "md" | "lg";
}) {
  const dims = SIZES[size];
  const fillPercent = fill * 100;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.bottleWrap, { width: dims.width, height: dims.height }]}
    >
      <View style={styles.inner}>
        <BottleSvg
          fillPercent={fillPercent}
          width={dims.width}
          height={dims.height}
        />
      </View>
    </Pressable>
  );
}

export function BottleDisplay({
  consumedBottles,
  goalBottles,
  onBottlePress,
  size = "lg",
}: BottleDisplayProps) {
  const count = Math.max(1, goalBottles);

  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, index) => (
        <BottleIcon
          key={index}
          fill={bottleFillAtIndex(consumedBottles, index)}
          onPress={onBottlePress ? () => onBottlePress(index) : undefined}
          size={size}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },
  bottleWrap: {
    ...Platform.select({
      ios: {
        shadowColor: uiTheme.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      web: { boxShadow: "0 2px 8px rgba(124,106,255,0.15)" },
    }),
  },
  inner: {
    flex: 1,
  },
});
