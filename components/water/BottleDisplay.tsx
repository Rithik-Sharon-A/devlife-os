import { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { uiTheme } from "../ui/theme";

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

const BOTTLE_PATH =
  "M16 4h16v6c0 4 6 8 6 14v34c0 6-5 10-14 10s-14-4-14-10V24c0-6 6-10 6-14V4z";

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
  const fillAnim = useRef(new Animated.Value(fill * 100)).current;

  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue: fill * 100,
      tension: 80,
      friction: 14,
      useNativeDriver: false,
    }).start();
  }, [fill, fillAnim]);

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <Pressable
      onPress={onPress}
      style={[styles.bottleWrap, { width: dims.width, height: dims.height }]}
    >
      <View style={styles.inner}>
        <Svg
          width={dims.width}
          height={dims.height}
          viewBox="0 0 48 80"
          style={StyleSheet.absoluteFill}
        >
          <Path
            d={BOTTLE_PATH}
            fill={uiTheme.surface2}
            stroke={uiTheme.border}
            strokeWidth={1.5}
          />
        </Svg>

        <View style={[styles.fillClip, { width: dims.width, height: dims.height }]}>
          <Animated.View style={[styles.waterFill, { height: fillHeight }]}>
            <View style={styles.waveSurface} />
          </Animated.View>
        </View>

        <Svg
          width={dims.width}
          height={dims.height}
          viewBox="0 0 48 80"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Path
            d={BOTTLE_PATH}
            fill="transparent"
            stroke={fill > 0 ? uiTheme.accent : uiTheme.border}
            strokeWidth={1.5}
            opacity={0.9}
          />
        </Svg>
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
    overflow: "hidden",
  },
  fillClip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    overflow: "hidden",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  waterFill: {
    position: "absolute",
    bottom: 0,
    left: -4,
    right: -4,
    backgroundColor: uiTheme.accent,
    opacity: 0.85,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    minHeight: 2,
  },
  waveSurface: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: `${uiTheme.accent}cc`,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
});
