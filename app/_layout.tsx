import "react-native-gesture-handler";
import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export const unstable_settings = {
  initialRouteName: "onboarding",
};

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0d0f12" },
          animation: "fade",
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
