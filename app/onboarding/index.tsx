import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingWelcome() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-4xl font-bold text-white">DayOS</Text>
        <Text className="mt-3 text-center text-base text-muted">
          Your daily operating system for health, focus, and habits.
        </Text>
        <Link
          href="/onboarding/body"
          className="mt-10 rounded-xl bg-accent px-8 py-4"
        >
          <Text className="text-base font-semibold text-white">Get Started</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
