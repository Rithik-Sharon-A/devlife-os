import "react-native-gesture-handler";

// Suppress expo-notifications Expo Go warning
const originalError = console.error;
console.error = (...args: unknown[]) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("expo-notifications") &&
    args[0].includes("Expo Go")
  ) {
    return;
  }
  originalError(...args);
};

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppBootstrap } from "../components/AppBootstrap";
import { AppSplash } from "../components/AppSplash";
import { CelebrationProvider } from "../components/providers/CelebrationProvider";
import { ToastProvider } from "../components/providers/ToastProvider";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { useDayRollover } from "../hooks/useDayRollover";
import { useAppStore } from "../store/useAppStore";
import { radii, spacing } from "../utils/designTokens";
import { startBackgroundStepCounter } from "../utils/stepCounterTask";
import { typography } from "../utils/typography";

export const unstable_settings = {
  initialRouteName: "index",
};

function DayRolloverWatcher() {
  useDayRollover();
  return null;
}

function LoadingScreen() {
  const { theme } = useTheme();
  const { colors } = theme;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        loading: {
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing.lg,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.base,
        },
        logoBox: {
          width: 56,
          height: 56,
          borderRadius: radii.md,
          backgroundColor: colors.surface1,
          alignItems: "center",
          justifyContent: "center",
        },
        logoIcon: {
          fontSize: 28,
          fontWeight: "700",
          color: colors.accent,
        },
        titleRow: {
          flexDirection: "row",
        },
        day: {
          ...typography.display,
          fontSize: 32,
          color: colors.textPrimary,
        },
        os: {
          ...typography.display,
          fontSize: 32,
          color: colors.accent,
        },
        tagline: {
          ...typography.body,
          color: colors.textSecondary,
          marginTop: spacing.xs,
          maxWidth: 280,
          textAlign: "left",
        },
        spinner: {
          marginTop: spacing.xl,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.loading}>
      <View style={styles.row}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>▲</Text>
        </View>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.day}>Day</Text>
            <Text style={styles.os}>OS</Text>
          </View>
          <Text style={styles.tagline}>
            Your private operating system for the day.
          </Text>
        </View>
      </View>
      <ActivityIndicator
        size="large"
        color={colors.accent}
        style={styles.spinner}
      />
    </View>
  );
}

function RootShell() {
  const initializeStore = useAppStore((state) => state.initializeStore);
  const isStoreInitialized = useAppStore((state) => state.isStoreInitialized);
  const isLoading = useAppStore((state) => state.isLoading);
  const { theme } = useTheme();
  const { colors } = theme;

  const [splashMounted, setSplashMounted] = useState(true);

  useEffect(() => {
    void initializeStore();
  }, [initializeStore]);

  useEffect(() => {
    if (Platform.OS === "android") {
      startBackgroundStepCounter().catch(console.log);
    }
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
        },
      }),
    [colors.background]
  );

  if (isLoading && !isStoreInitialized) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.root}>
        <StatusBar style={theme.isLight ? "dark" : "light"} />
        <AppBootstrap />
        <DayRolloverWatcher />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "fade",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="morning" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        {splashMounted ? (
          <AppSplash
            visible={!isStoreInitialized}
            onHidden={() => setSplashMounted(false)}
          />
        ) : null}
      </View>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ToastProvider>
          <CelebrationProvider>
            <RootShell />
          </CelebrationProvider>
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
