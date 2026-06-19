import { Tabs, useSegments } from "expo-router";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AIChatSheet } from "../../components/ai/AIChatSheet";
import { useTheme } from "../../context/ThemeContext";
import { useAppStore } from "../../store/useAppStore";
import { isAIConfigured } from "../../utils/ai";

const TAB_ICONS: Record<string, string> = {
  index: "🏠",
  health: "🫀",
  food: "🍛",
  water: "💧",
  habits: "✅",
  settings: "⚙️",
};

const TAB_BAR_HEIGHT = 60;
const INACTIVE_COLOR = "#4a4a5a";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const hideTabBar =
    segments.includes("add-meal") || segments.includes("meal-detail");
  const { theme } = useTheme();
  const { colors } = theme;
  const aiConfig = useAppStore((s) => s.aiConfig);
  const [chatOpen, setChatOpen] = useState(false);

  const showChatFab = isAIConfigured(aiConfig);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        tabIconWrap: {
          alignItems: "center",
          justifyContent: "center",
          minHeight: 28,
        },
        tabIcon: {
          fontSize: 22,
        },
        activeDot: {
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.accent,
          marginTop: 2,
        },
        fab: {
          position: "absolute",
          left: 20,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 8,
          zIndex: 999,
        },
        fabIcon: {
          fontSize: 24,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <Tabs
        screenListeners={{
          tabPress: () => {
            if (Platform.OS !== "web") {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
        }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: INACTIVE_COLOR,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
          tabBarStyle: hideTabBar
            ? { display: "none" }
            : {
                backgroundColor: "#0f0f16",
                borderTopColor: "#1a1a24",
                borderTopWidth: 1,
                height: TAB_BAR_HEIGHT + insets.bottom,
                paddingTop: 6,
                paddingBottom: insets.bottom + 4,
              },
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconWrap}>
              <Text style={[styles.tabIcon, { color, opacity: focused ? 1 : 0.9 }]}>
                {TAB_ICONS[route.name] ?? "•"}
              </Text>
              {focused ? <View style={styles.activeDot} /> : null}
            </View>
          ),
        })}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="health" options={{ title: "Health" }} />
        <Tabs.Screen name="food" options={{ title: "Food" }} />
        <Tabs.Screen name="water" options={{ title: "Water" }} />
        <Tabs.Screen name="habits" options={{ title: "Habits" }} />
        <Tabs.Screen name="settings" options={{ href: null }} />
      </Tabs>

      {showChatFab && !hideTabBar ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open AI chat"
          onPress={() => setChatOpen(true)}
          style={[styles.fab, { bottom: insets.bottom + 96 }]}
        >
          <Text style={styles.fabIcon}>💬</Text>
        </Pressable>
      ) : null}

      <AIChatSheet visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
}
