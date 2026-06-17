import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppStore } from "@store/app";

export default function SettingsScreen() {
  const setOnboardingComplete = useAppStore((state) => state.setOnboardingComplete);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-4">
        <Text className="text-2xl font-bold text-white">Settings</Text>
        <Text className="mt-2 text-muted">Manage your DayOS preferences.</Text>
        <Pressable
          className="mt-8 self-start rounded-xl border border-border px-6 py-3"
          onPress={() => setOnboardingComplete(false)}
        >
          <Text className="text-white">Reset Onboarding</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
