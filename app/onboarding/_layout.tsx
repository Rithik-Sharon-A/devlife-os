import { Redirect, Stack, usePathname } from "expo-router";
import { StyleSheet, View } from "react-native";

import { useAppStore } from "../../store/useAppStore";
import { uiTheme } from "../../components/ui/theme";

function getStepFromPath(pathname: string): number {
  if (pathname.endsWith("/body")) return 2;
  if (pathname.endsWith("/activity")) return 3;
  if (pathname.endsWith("/water")) return 4;
  if (pathname.endsWith("/sleep")) return 5;
  if (pathname.endsWith("/ai")) return 6;
  return 1;
}

export default function OnboardingLayout() {
  const isOnboarded = useAppStore((s) => s.isOnboarded);

  if (isOnboarded) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: uiTheme.background },
          animation: "slide_from_right",
        }}
      />
    </View>
  );
}

export function useOnboardingStep(): number {
  const pathname = usePathname();
  return getStepFromPath(pathname);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: uiTheme.background,
  },
});
