import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FoodScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-bold text-white">Food</Text>
        <Text className="mt-2 text-muted">Log meals and track nutrition.</Text>
      </View>
    </SafeAreaView>
  );
}
