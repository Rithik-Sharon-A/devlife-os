import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0d0f12",
          borderTopColor: "#1a1d23",
        },
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#6b7280",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="focus" options={{ title: "Focus" }} />
      <Tabs.Screen name="food" options={{ title: "Food" }} />
      <Tabs.Screen name="water" options={{ title: "Water" }} />
      <Tabs.Screen name="habits" options={{ title: "Habits" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
