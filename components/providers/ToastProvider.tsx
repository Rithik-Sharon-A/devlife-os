import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { StyleSheet, Text } from "react-native";

import { shadows } from "../../utils/styles";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { uiTheme } from "../ui/theme";

export type ToastVariant = "success" | "error" | "info";

interface ToastPayload {
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_COLORS: Record<ToastVariant, string> = {
  success: uiTheme.success,
  error: uiTheme.danger,
  info: "#7c6aff",
};

const DISMISS_MS = 3000;

function GlobalToast({
  toast,
  onDismiss,
}: {
  toast: ToastPayload | null;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!toast) {
      translateY.value = withTiming(-120, { duration: 220 });
      opacity.value = withTiming(0, { duration: 220 });
      return;
    }

    translateY.value = withTiming(0, { duration: 280 });
    opacity.value = withTiming(1, { duration: 280 });

    const timer = setTimeout(() => {
      translateY.value = withTiming(-120, { duration: 220 });
      opacity.value = withTiming(0, { duration: 220 }, (finished) => {
        if (finished) runOnJS(onDismiss)();
      });
    }, DISMISS_MS);

    return () => clearTimeout(timer);
  }, [toast, onDismiss, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!toast) return null;

  const accent = VARIANT_COLORS[toast.variant];

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { top: insets.top + 8, borderColor: `${accent}66` }, style]}
    >
      <Text style={[styles.text, { color: accent }]}>{toast.message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    setToast({ message, variant });
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <GlobalToast toast={toast} onDismiss={() => setToast(null)} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: uiTheme.surface2,
    borderWidth: 1,
    borderRadius: uiTheme.radiusInput,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    ...shadows.toast,
  },
  text: {
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
});
