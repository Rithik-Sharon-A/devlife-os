import { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { APP_NAME } from "../../utils/appBrand";
import { CELEBRATION_CONFIGS } from "../../data/celebrationConfigs";
import type { CelebrationExtraData, CelebrationType } from "../../types/celebrations";
import Confetti from "./Confetti";
import SafeLottie, { type LottieRef } from "./SafeLottie";

const { width } = Dimensions.get("window");

interface CelebrationOverlayProps {
  type: CelebrationType | null;
  visible: boolean;
  onDismiss: () => void;
  extraData?: CelebrationExtraData;
}

export default function CelebrationOverlay({
  type,
  visible,
  onDismiss,
  extraData,
}: CelebrationOverlayProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.6)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieRef | null>(null);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const config = type ? CELEBRATION_CONFIGS[type] : null;

  const animateOut = useCallback(() => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.85,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      cardScale.setValue(0.6);
      cardOpacity.setValue(0);
      backdropOpacity.setValue(0);
      onDismiss();
    });
  }, [backdropOpacity, cardOpacity, cardScale, onDismiss]);

  useEffect(() => {
    if (visible && config) {
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 130,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        lottieRef.current?.play();
      });

      if (config.autoCloseDuration > 0) {
        autoCloseTimer.current = setTimeout(animateOut, config.autoCloseDuration);
      }
    }

    return () => {
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
      }
    };
  }, [visible, config, animateOut, backdropOpacity, cardOpacity, cardScale]);

  const handleShare = async () => {
    if (!config) return;
    try {
      await Share.share({
        message: `${config.title}\n${config.subtitle}\n\nTracked with ${APP_NAME} 🎯`,
      });
    } catch {
      // Share cancelled or failed
    }
    animateOut();
  };

  if (!visible || !config || !type) return null;

  const isLarge = config.size === "large";
  const showExtraBadge =
    extraData &&
    (extraData.streakCount !== undefined ||
      extraData.weightLost !== undefined ||
      extraData.customMessage);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={animateOut}
    >
      {config.showConfetti ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Confetti visible={visible} />
        </View>
      ) : null}

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: "rgba(0,0,0,0.82)",
            opacity: backdropOpacity,
          },
        ]}
      >
        {!isLarge ? (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={animateOut}
            activeOpacity={1}
          />
        ) : null}
      </Animated.View>

      <View style={styles.container}>
        <Animated.View
          style={[
            isLarge ? styles.cardLarge : styles.cardSmall,
            {
              transform: [{ scale: cardScale }],
              opacity: cardOpacity,
              borderColor: `${config.accentColor}45`,
            },
          ]}
        >
          <View
            style={[styles.lottieGlow, { backgroundColor: `${config.accentColor}18` }]}
          />

          <SafeLottie
            ref={lottieRef}
            source={config.animation}
            style={isLarge ? styles.lottieLarge : styles.lottieSmall}
            autoPlay={false}
            loop={false}
            speed={0.85}
            resizeMode="contain"
          />

          <Text style={[styles.title, isLarge ? styles.titleLarge : styles.titleSmall]}>
            {config.title}
          </Text>

          <Text style={styles.subtitle}>{config.subtitle}</Text>

          {showExtraBadge ? (
            <View
              style={[
                styles.extraBadge,
                {
                  backgroundColor: `${config.accentColor}18`,
                  borderColor: `${config.accentColor}45`,
                },
              ]}
            >
              <Text style={[styles.extraBadgeText, { color: config.accentColor }]}>
                {extraData?.streakCount !== undefined
                  ? `🔥 ${extraData.streakCount} days in a row`
                  : extraData?.weightLost !== undefined
                    ? `⚖️ -${extraData.weightLost.toFixed(1)}kg total lost`
                    : extraData?.customMessage}
              </Text>
            </View>
          ) : null}

          <View style={[styles.accentLine, { backgroundColor: config.accentColor }]} />

          <View style={styles.buttonStack}>
            {config.showShareButton ? (
              <TouchableOpacity
                style={[styles.shareButton, { backgroundColor: config.accentColor }]}
                onPress={handleShare}
                activeOpacity={0.85}
              >
                <Text style={styles.shareButtonText}>Share Achievement 🎉</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={animateOut}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dismissButtonText,
                  isLarge && { color: "#a0a0b0", fontSize: 16 },
                ]}
              >
                {config.dismissLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  cardLarge: {
    backgroundColor: "#13131a",
    borderRadius: 28,
    padding: 32,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    borderWidth: 1,
  },
  cardSmall: {
    backgroundColor: "#13131a",
    borderRadius: 24,
    padding: 28,
    width: "85%",
    maxWidth: 320,
    alignItems: "center",
    borderWidth: 1,
  },
  lottieGlow: {
    position: "absolute",
    top: 24,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  lottieLarge: {
    width: 180,
    height: 180,
    marginBottom: 4,
  },
  lottieSmall: {
    width: 120,
    height: 120,
    marginBottom: 4,
  },
  title: {
    fontWeight: "700",
    color: "#f0f0ff",
    textAlign: "center",
    marginBottom: 8,
  },
  titleLarge: {
    fontSize: 28,
    letterSpacing: -0.3,
  },
  titleSmall: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  extraBadge: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 20,
  },
  extraBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  accentLine: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginBottom: 24,
    opacity: 0.6,
  },
  buttonStack: {
    width: "100%",
    gap: 8,
  },
  shareButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    width: "100%",
  },
  shareButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
  },
  dismissButtonText: {
    color: "#5a5a6a",
    fontSize: 14,
    fontWeight: "500",
  },
});
