import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const COLORS = [
  "#7c6aff",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#0ea5e9",
  "#ff6eb4",
  "#ff6b2b",
  "#4ade80",
  "#00d4aa",
  "#a78bfa",
  "#fb923c",
  "#38bdf8",
];

const PIECE_COUNT = 50;

interface Piece {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  isCircle: boolean;
  swayAmount: number;
}

const PIECES: Piece[] = Array.from({ length: PIECE_COUNT }, (_, i) => ({
  id: i,
  x: (width / PIECE_COUNT) * i + Math.random() * (width / PIECE_COUNT),
  color: COLORS[i % COLORS.length],
  size: Math.random() * 10 + 5,
  delay: Math.random() * 800,
  duration: Math.random() * 1000 + 1500,
  isCircle: i % 3 === 0,
  swayAmount: (Math.random() - 0.5) * 120,
}));

interface ConfettiProps {
  visible: boolean;
  onComplete?: () => void;
}

export default function Confetti({ visible, onComplete }: ConfettiProps) {
  const anims = useRef(
    PIECES.map(() => ({
      y: new Animated.Value(-30),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
      sway: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;

    anims.forEach((a) => {
      a.y.setValue(-30);
      a.opacity.setValue(0);
      a.rotate.setValue(0);
      a.sway.setValue(0);
    });

    const animations = anims.map((anim, i) => {
      const piece = PIECES[i];
      return Animated.sequence([
        Animated.delay(piece.delay),
        Animated.parallel([
          Animated.timing(anim.y, {
            toValue: height + 60,
            duration: piece.duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: 1,
            duration: piece.duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(anim.sway, {
              toValue: piece.swayAmount,
              duration: piece.duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(anim.sway, {
              toValue: -piece.swayAmount * 0.6,
              duration: piece.duration / 2,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.delay(piece.duration * 0.65),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: piece.duration * 0.35,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      onComplete?.();
    });
  }, [visible, anims, onComplete]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PIECES.map((piece, i) => {
        const spin = anims[i].rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "720deg"],
        });

        return (
          <Animated.View
            key={piece.id}
            style={{
              position: "absolute",
              left: piece.x,
              top: 0,
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: piece.isCircle ? piece.size / 2 : 2,
              transform: [
                { translateY: anims[i].y },
                { translateX: anims[i].sway },
                { rotate: spin },
              ],
              opacity: anims[i].opacity,
            }}
          />
        );
      })}
    </View>
  );
}
