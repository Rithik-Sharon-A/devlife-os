import "react-native-gesture-handler";
import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
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

export default function RootLayout() {
  const initializeStore = useAppStore((state) => state.initializeStore);
  const isStoreInitialized = useAppStore((state) => state.isStoreInitialized);

  const [splashMounted, setSplashMounted] = useState(true);

  useEffect(() => {
    void initializeStore();
  }, [initializeStore]);

  return (
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
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0d0f12",
  },
});
