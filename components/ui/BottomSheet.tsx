import type { PropsWithChildren } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  type DimensionValue,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { uiTheme } from "./theme";

type SheetHeight = "half" | "full" | number;

interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  title?: string;
  height?: SheetHeight;
}

const SLIDE_OFFSET = 400;

function resolveHeight(height: SheetHeight): DimensionValue {
  if (typeof height === "number") return height;
  return height === "full" ? "92%" : "52%";
}

export function BottomSheet({
  visible,
  onClose,
  children,
  title,
  height = "half",
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(visible);
  const slideAnim = useRef(new Animated.Value(SLIDE_OFFSET)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      slideAnim.setValue(SLIDE_OFFSET);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mounted) return;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SLIDE_OFFSET,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
    });
  }, [backdropAnim, mounted, slideAnim, visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SLIDE_OFFSET,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      onClose();
    });
  };

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.backdrop,
            { opacity: backdropAnim },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={dismiss} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { height: resolveHeight(height), transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.dragHandle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    backgroundColor: uiTheme.surface1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: uiTheme.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },
  dragHandle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: uiTheme.radiusPill,
    backgroundColor: uiTheme.surface3,
    marginBottom: 12,
  },
  title: {
    color: uiTheme.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
});
