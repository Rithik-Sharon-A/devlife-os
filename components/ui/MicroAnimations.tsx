import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface BounceButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function BounceButton({
  onPress,
  children,
  style,
  disabled,
}: BounceButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity onPress={handlePress} disabled={disabled} activeOpacity={1}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

interface HabitCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  accentColor?: string;
}

export function HabitCheckbox({
  checked,
  onToggle,
  accentColor = "#7c6aff",
}: HabitCheckboxProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  const spin = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ["-360deg", "360deg"],
  });

  const handlePress = () => {
    if (!checked) {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.35,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            tension: 320,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(rotation, {
            toValue: -12,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(rotation, {
            toValue: 12,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(rotation, {
            toValue: -6,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.spring(rotation, {
            toValue: 0,
            tension: 200,
            friction: 10,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 0.75,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 200,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale }, { rotate: spin }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={[
          styles.checkbox,
          {
            backgroundColor: checked ? accentColor : "transparent",
            borderColor: checked ? accentColor : "#2a2a3a",
          },
        ]}
      >
        {checked ? <Text style={styles.checkmark}>✓</Text> : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedCard({ children, delay = 0, style }: AnimatedCardProps) {
  const translateY = useRef(new Animated.Value(24)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 140,
          friction: 18,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[{ transform: [{ translateY }], opacity }, style]}>
      {children}
    </Animated.View>
  );
}

interface PulsingFireProps {
  count: number;
  size?: number;
}

export function PulsingFire({ count, size = 24 }: PulsingFireProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.18,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.0,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <Animated.View style={[styles.fireContainer, { transform: [{ scale }] }]}>
      <Text style={{ fontSize: size }}>🔥</Text>
      <Text style={[styles.fireCount, { fontSize: size * 0.5 }]}>{count}</Text>
    </Animated.View>
  );
}

interface WaterBottleProps {
  fillPercent: number;
  accentColor?: string;
}

export function AnimatedWaterBottle({
  fillPercent,
  accentColor = "#0ea5e9",
}: WaterBottleProps) {
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fill, {
      toValue: Math.min(100, Math.max(0, fillPercent)),
      tension: 80,
      friction: 14,
      useNativeDriver: false,
    }).start();
  }, [fillPercent, fill]);

  const fillHeight = fill.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.bottle}>
      <Animated.View
        style={[
          styles.bottleFill,
          { height: fillHeight, backgroundColor: accentColor },
        ]}
      />
    </View>
  );
}

export function useScoreAnimation(targetScore: number) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.timing(progress, {
        toValue: targetScore / 100,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [progress, targetScore]);

  return progress;
}

interface CountUpProps {
  value: number;
  style?: object;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function CountUpNumber({
  value,
  style,
  prefix = "",
  suffix = "",
  decimals = 0,
}: CountUpProps) {
  const animValue = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    animValue.setValue(0);
    const listenerId = animValue.addListener(({ value: current }) => {
      setDisplay(current);
    });

    Animated.timing(animValue, {
      toValue: value,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      animValue.removeListener(listenerId);
    };
  }, [animValue, value]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();

  return (
    <Text style={style}>
      {prefix}
      {formatted}
      {suffix}
    </Text>
  );
}

export function useShakeAnimation() {
  const translateX = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(translateX, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -4, duration: 60, useNativeDriver: true }),
      Animated.spring(translateX, {
        toValue: 0,
        tension: 200,
        friction: 15,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animStyle = {
    transform: [{ translateX }],
  };

  return { shake, animStyle };
}

export function FadeIn({
  children,
  delay = 0,
  duration = 300,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, duration, opacity]);

  return <Animated.View style={[{ opacity }, style]}>{children}</Animated.View>;
}

const SLIDE_DISTANCE = 300;

export function SlideUp({
  children,
  visible,
  style,
}: {
  children: React.ReactNode;
  visible: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const translateY = useRef(new Animated.Value(SLIDE_DISTANCE)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 200,
          friction: 20,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SLIDE_DISTANCE,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [opacity, translateY, visible]);

  return (
    <Animated.View
      style={[{ transform: [{ translateY }], opacity }, style]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  fireContainer: {
    alignItems: "center",
    gap: 2,
  },
  fireCount: {
    color: "#ff6b2b",
    fontWeight: "700",
  },
  bottle: {
    width: 36,
    height: 72,
    backgroundColor: "#1a1a24",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#2a2a3a",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  bottleFill: {
    width: "100%",
    borderRadius: 8,
  },
});
