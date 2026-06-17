import { Tabs } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { shadows } from "../../utils/styles";

import { AIChatSheet } from "../../components/ai/AIChatSheet";
import { useAppStore } from "../../store/useAppStore";
import { isAIConfigured } from "../../utils/ai";

const TAB_ICONS: Record<string, string> = {
  index: "🏠",
  focus: "⏱️",
  food: "🍛",
  water: "💧",
  habits: "✅",
};

const TAB_BAR_HEIGHT = 56;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const aiConfig = useAppStore((s) => s.aiConfig);
  const [chatOpen, setChatOpen] = useState(false);

  const showChatFab = isAIConfigured(aiConfig);

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#161a20",
            borderTopColor: "#1f2937",
            borderTopWidth: 1,
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingTop: 8,
            paddingBottom: insets.bottom + 4,
          },
          tabBarActiveTintColor: "#7c6aff",
          tabBarInactiveTintColor: "#64748b",
          tabBarIcon: ({ color }) => (
            <Text style={[styles.tabIcon, { color }]}>{TAB_ICONS[route.name] ?? "•"}</Text>
          ),
        })}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="focus" options={{ title: "Focus" }} />
        <Tabs.Screen name="food" options={{ title: "Food" }} />
        <Tabs.Screen name="water" options={{ title: "Water" }} />
        <Tabs.Screen name="habits" options={{ title: "Habits" }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
      </Tabs>

      {showChatFab ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open AI chat"
          onPress={() => setChatOpen(true)}
          style={[
            styles.fab,
            { bottom: TAB_BAR_HEIGHT + insets.bottom + 12 },
          ]}
        >
          <Text style={styles.fabIcon}>💬</Text>
        </Pressable>
      ) : null}

      <AIChatSheet visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0f12",
  },
  tabIcon: {
    fontSize: 22,
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7c6aff",
    alignItems: "center",
    justifyContent: "center",
    ...shadows.fab,
    zIndex: 50,
  },
  fabIcon: {
    fontSize: 24,
  },
});
