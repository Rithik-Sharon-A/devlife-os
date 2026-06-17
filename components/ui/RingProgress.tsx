import type { ReactNode } from "react";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useTheme } from "../../context/ThemeContext";
import { typography } from "../../utils/typography";

export type RingVariant = "default" | "calorie" | "water";

interface RingProgressProps {
  size?: number;
  progress: number;
  color?: string;
  strokeWidth?: number;
  trackColor?: string;
  variant?: RingVariant;
  centerValue?: string;
  centerLabel?: string;
  children?: ReactNode;
}

export function RingProgress({
  size,
  progress,
  color,
  strokeWidth,
  trackColor,
  variant = "default",
  centerValue,
  centerLabel,
  children,
}: RingProgressProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  const resolvedSize =
    size ?? (variant === "calorie" ? 100 : variant === "water" ? 80 : 100);
  const resolvedStroke =
    strokeWidth ?? (variant === "calorie" ? 10 : variant === "water" ? 8 : 10);
  const resolvedColor =
    color ??
    (variant === "water" ? colors.success : colors.accent);
  const resolvedTrack = trackColor ?? colors.surface3;

  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (resolvedSize - resolvedStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clamped);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          width: resolvedSize,
          height: resolvedSize,
          justifyContent: "center",
          alignItems: "center",
        },
        center: {
          position: "absolute",
          justifyContent: "center",
          alignItems: "center",
        },
        centerValue: {
          ...typography.mono,
          fontSize: variant === "calorie" ? 32 : 22,
          color: colors.textPrimary,
        },
        centerLabel: {
          ...typography.caption,
          color: colors.textSecondary,
          marginTop: 2,
          textTransform: "lowercase",
        },
      }),
    [colors, resolvedSize, variant]
  );

  const centerContent =
    children ??
    (centerValue ? (
      <>
        <Text style={styles.centerValue}>{centerValue}</Text>
        {centerLabel ? (
          <Text style={styles.centerLabel}>{centerLabel}</Text>
        ) : null}
      </>
    ) : null);

  return (
    <View style={styles.wrapper}>
      <Svg width={resolvedSize} height={resolvedSize}>
        <Circle
          cx={resolvedSize / 2}
          cy={resolvedSize / 2}
          r={radius}
          stroke={resolvedTrack}
          strokeWidth={resolvedStroke}
          fill="transparent"
        />
        <Circle
          cx={resolvedSize / 2}
          cy={resolvedSize / 2}
          r={radius}
          stroke={resolvedColor}
          strokeWidth={resolvedStroke}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${resolvedSize / 2} ${resolvedSize / 2})`}
        />
      </Svg>
      {centerContent ? <View style={styles.center}>{centerContent}</View> : null}
    </View>
  );
}
