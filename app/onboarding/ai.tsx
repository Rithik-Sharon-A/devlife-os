import { Link } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingAI() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-bold text-white">AI Assistant</Text>
        <Text className="mt-2 text-muted">
          Enable personalized insights powered by your daily data.
        </Text>
        <Link href="/(tabs)" className="mt-8 self-start rounded-xl bg-accent px-6 py-3">
          <Text className="font-semibold text-white">Finish Setup</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
