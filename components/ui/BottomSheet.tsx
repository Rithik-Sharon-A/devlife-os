import type { PropsWithChildren } from "react";
import {
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
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { height: resolveHeight(height) }]}>
          <View style={styles.dragHandle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          <View style={styles.content}>{children}</View>
        </View>
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
