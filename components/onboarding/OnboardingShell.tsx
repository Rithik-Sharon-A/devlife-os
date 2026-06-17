import { router } from "expo-router";
import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { uiTheme } from "../ui/theme";

interface OnboardingShellProps extends PropsWithChildren {
  step: number;
  totalSteps?: number;
  showBack?: boolean;
  footer?: React.ReactNode;
}

export function OnboardingShell({
  step,
  totalSteps = 6,
  showBack = true,
  footer,
  children,
}: OnboardingShellProps) {
  const progress = step / totalSteps;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          {showBack && step > 1 ? (
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Text style={styles.stepText}>
            Step {step} of {totalSteps}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: uiTheme.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backText: {
    color: uiTheme.accent,
    fontWeight: "600",
    fontSize: 15,
  },
  backPlaceholder: {
    width: 64,
  },
  stepText: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  progressTrack: {
    height: 4,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: uiTheme.radiusPill,
    backgroundColor: uiTheme.surface2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: uiTheme.accent,
    borderRadius: uiTheme.radiusPill,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: uiTheme.border,
    backgroundColor: uiTheme.background,
  },
});
