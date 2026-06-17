import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppStore } from "@store/app";

export default function HomeScreen() {
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <Text className="text-3xl font-bold text-white">DayOS</Text>
        <Text className="mt-2 text-muted">
          {onboardingComplete ? "Welcome back." : "Complete onboarding to unlock your dashboard."}
        </Text>
      </View>
    </SafeAreaView>
  );
}
