import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { themeAccents } from "../../utils/designTokens";
import { getTheme, type AppThemeId } from "../../utils/themes";

const THEME_DOT_COLORS: Record<AppThemeId, string> = {
  midnight: themeAccents.midnight,
  aurora: themeAccents.aurora,
  ember: themeAccents.ember,
  sakura: themeAccents.sakura,
  ocean: themeAccents.ocean,
  forest: themeAccents.forest,
  neonTokyo: themeAccents.neonTokyo,
  parchment: themeAccents.parchment,
};

export function ThemePicker() {
  const { themeId, setThemeId, themeOrder } = useTheme();
  const current = getTheme(themeId);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#1e1e28",
        },
        current: {
          fontSize: 15,
          fontWeight: "400",
          color: "#e2e8f0",
        },
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          padding: 16,
        },
        card: {
          width: "47.5%",
          height: 56,
          borderRadius: 14,
          padding: 14,
          backgroundColor: "#13131a",
          borderWidth: 1,
          borderColor: "#2a2a3a",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        cardSelected: {
          borderWidth: 1.5,
          borderColor: current.colors.accent,
        },
        cardLeft: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          flex: 1,
        },
        dot: {
          width: 12,
          height: 12,
          borderRadius: 6,
        },
        cardName: {
          fontSize: 14,
          fontWeight: "600",
          color: "#e2e8f0",
        },
        check: {
          fontSize: 12,
          fontWeight: "700",
          color: current.colors.accent,
        },
      }),
    [current.colors.accent]
  );

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.current}>
          Current theme: {current.name} {current.emoji}
        </Text>
      </View>

      <View style={styles.grid}>
        {themeOrder.map((id) => {
          const t = getTheme(id);
          const selected = id === themeId;

          return (
            <Pressable
              key={id}
              onPress={() => setThemeId(id)}
              style={[styles.card, selected && styles.cardSelected]}
            >
              <View style={styles.cardLeft}>
                <View
                  style={[styles.dot, { backgroundColor: THEME_DOT_COLORS[id] }]}
                />
                <Text style={styles.cardName} numberOfLines={1}>
                  {t.name}
                </Text>
              </View>
              {selected ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
