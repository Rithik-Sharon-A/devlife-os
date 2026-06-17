import { Tabs } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AIChatSheet } from "../../components/ai/AIChatSheet";
import { useTheme } from "../../context/ThemeContext";
import { useAppStore } from "../../store/useAppStore";
import { radii, spacing } from "../../utils/designTokens";
import { isAIConfigured } from "../../utils/ai";
import { shadows } from "../../utils/styles";

const TAB_ICONS: Record<string, string> = {
  index: "🏠",
  focus: "⏱️",
  food: "🍛",
  water: "💧",
  habits: "✅",
  settings: "⚙️",
};

const TAB_BAR_HEIGHT = 56;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
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
        tabIcon: {
          fontSize: 22,
        },
        fab: {
          position: "absolute",
          right: spacing.lg,
          width: 56,
          height: 56,
          borderRadius: radii.pill,
          backgroundColor: colors.accent,
          alignItems: "center",
          justifyContent: "center",
          ...shadows.fab,
          zIndex: 50,
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
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
          tabBarStyle: {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.xs,
          },
          tabBarIcon: ({ color, focused }) => (
            <Text style={[styles.tabIcon, { color, opacity: focused ? 1 : 0.85 }]}>
              {TAB_ICONS[route.name] ?? "•"}
            </Text>
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
            { bottom: TAB_BAR_HEIGHT + insets.bottom + spacing.md },
          ]}
        >
          <Text style={styles.fabIcon}>💬</Text>
        </Pressable>
      ) : null}

      <AIChatSheet visible={chatOpen} onClose={() => setChatOpen(false)} />
    </View>
  );
}
