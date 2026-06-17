import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingWater() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-bold text-white">Water Goal</Text>
        <Text className="mt-2 text-muted">Set your daily hydration target.</Text>
        <Link href="/onboarding/sleep" className="mt-8 self-start rounded-xl bg-accent px-6 py-3">
          <Text className="font-semibold text-white">Continue</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
