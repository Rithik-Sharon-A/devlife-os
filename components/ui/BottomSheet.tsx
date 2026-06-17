import type { PropsWithChildren } from "react";
import {
  type DimensionValue,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { uiTheme } from "./theme";

type SheetHeight = "half" | "full" | number;

interface BottomSheetProps extends PropsWithChildren {
  visible: boolean;
  onClose: () => void;
  title?: string;
  height?: SheetHeight;
}

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
  const translateY = useSharedValue(400);

  translateY.value = withTiming(visible ? 0 : 400, { duration: 260 });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.sheet, { height: resolveHeight(height) }, sheetStyle]}>
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
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
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
