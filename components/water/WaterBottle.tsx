import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Animated, View } from "react-native";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";

import { useTheme } from "../ui/theme";
import { themeAccents } from "../../utils/designTokens";

/** Fixed water liquid color — never follows theme accent. */
const WATER_LIQUID = themeAccents.ocean;
const WATER_SURFACE = "#38bdf8";

const VIEW_W = 48;
const VIEW_H = 80;
const STROKE_WIDTH = 2.25;

const BOTTLE_PATH =
  "M16 4h16v6c0 4 6 8 6 14v34c0 6-5 10-14 10s-14-4-14-10V24c0-6 6-10 6-14V4z";

interface BottleSvgProps {
  fillPercent: number;
  width: number;
  height: number;
}

/** SVG bottle with water clipped to the bottle silhouette. */
export function BottleSvg({ fillPercent, width, height }: BottleSvgProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  const bottleColors = useMemo(
    () => ({
      shell: colors.surface2,
      stroke: colors.border,
      strokeOuter: colors.textSecondary,
    }),
    [colors.border, colors.surface2, colors.textSecondary]
  );

  const clipId = useId().replace(/:/g, "");
  const animatedFill = useRef(new Animated.Value(fillPercent)).current;
  const [displayFill, setDisplayFill] = useState(fillPercent);

  useEffect(() => {
    const listenerId = animatedFill.addListener(({ value }) => {
      setDisplayFill(value);
    });

    Animated.spring(animatedFill, {
      toValue: fillPercent,
      tension: 60,
      friction: 12,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedFill.removeListener(listenerId);
    };
  }, [animatedFill, fillPercent]);

  const clamped = Math.max(0, Math.min(100, displayFill));
  const waterH = (VIEW_H * clamped) / 100;
  const waterTop = VIEW_H - waterH;
  const isFull = clamped >= 99;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        <Defs>
          <ClipPath id={clipId}>
            <Path d={BOTTLE_PATH} />
          </ClipPath>
        </Defs>

        <Path
          d={BOTTLE_PATH}
          fill={bottleColors.shell}
          stroke={bottleColors.stroke}
          strokeWidth={STROKE_WIDTH}
        />

        {clamped > 0 ? (
          <G clipPath={`url(#${clipId})`}>
            <Rect
              x={0}
              y={waterTop}
              width={VIEW_W}
              height={waterH + 1}
              fill={WATER_LIQUID}
              opacity={0.92}
            />
            <Rect
              x={0}
              y={waterTop}
              width={VIEW_W}
              height={3}
              fill={WATER_SURFACE}
              opacity={0.75}
            />
          </G>
        ) : null}

        {isFull ? (
          <G clipPath={`url(#${clipId})`}>
            <Path
              d={BOTTLE_PATH}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={1}
            />
          </G>
        ) : null}

        <Path
          d={BOTTLE_PATH}
          fill="transparent"
          stroke={bottleColors.strokeOuter}
          strokeWidth={STROKE_WIDTH}
          opacity={0.55}
        />
        <Path
          d={BOTTLE_PATH}
          fill="transparent"
          stroke={bottleColors.stroke}
          strokeWidth={STROKE_WIDTH}
        />
      </Svg>
    </View>
  );
}

interface WaterBottleProps {
  fillPercent: number;
  width?: number;
  height?: number;
}

export default function WaterBottle({
  fillPercent,
  width = 70,
  height = 110,
}: WaterBottleProps) {
  return <BottleSvg fillPercent={fillPercent} width={width} height={height} />;
}

export function getBottleFillState(
  consumedBottles: number,
  index: number
): { fillPercent: number } {
  const full = Math.floor(consumedBottles);
  const fraction = consumedBottles - full;

  if (index < full) {
    return { fillPercent: 100 };
  }
  if (index === full && fraction > 0) {
    return { fillPercent: fraction * 100 };
  }
  return { fillPercent: 0 };
}
