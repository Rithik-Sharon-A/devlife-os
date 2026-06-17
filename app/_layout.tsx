import "react-native-gesture-handler";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppBootstrap } from "../components/AppBootstrap";
import { AppSplash } from "../components/AppSplash";
import { ToastProvider } from "../components/providers/ToastProvider";
import { useDayRollover } from "../hooks/useDayRollover";
import { useAppStore } from "../store/useAppStore";

export const unstable_settings = {
  initialRouteName: "index",
};

function DayRolloverWatcher() {
  useDayRollover();
  return null;
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <Text style={styles.loadingTitle}>DayOS</Text>
      <Text style={styles.loadingSubtitle}>Loading your day...</Text>
      <ActivityIndicator size="large" color="#7c6aff" style={styles.spinner} />
    </View>
  );
}

export default function RootLayout() {
  const initializeStore = useAppStore((state) => state.initializeStore);
  const isStoreInitialized = useAppStore((state) => state.isStoreInitialized);
  const isLoading = useAppStore((state) => state.isLoading);

  const [splashMounted, setSplashMounted] = useState(true);

  useEffect(() => {
    void initializeStore();
  }, [initializeStore]);

  if (isLoading && !isStoreInitialized) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
    <SafeAreaProvider>
      <ToastProvider>
        <View style={styles.root}>
          <StatusBar style="light" />
          <AppBootstrap />
          <DayRolloverWatcher />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#0d0f12" },
              animation: "fade",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          {splashMounted ? (
            <AppSplash
              visible={!isStoreInitialized}
              onHidden={() => setSplashMounted(false)}
            />
          ) : null}
        </View>
      </ToastProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0d0f12",
  },
  loading: {
    flex: 1,
    backgroundColor: "#0d0f12",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingTitle: {
    fontSize: 40,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 2,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 8,
  },
  spinner: {
    marginTop: 32,
  },
});
