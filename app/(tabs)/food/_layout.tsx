import { Stack } from "expo-router";

export default function FoodLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="add-meal"
        options={{
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="meal-detail"
        options={{
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
