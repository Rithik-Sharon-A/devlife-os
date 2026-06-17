import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../../context/ThemeContext";
import { radii, spacing } from "../../utils/designTokens";
import { getTheme, type AppThemeId } from "../../utils/themes";
import { typography } from "../../utils/typography";

export function ThemePicker() {
  const { themeId, setThemeId, themeOrder } = useTheme();
  const current = getTheme(themeId);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          gap: spacing.xs,
          marginBottom: spacing.md,
        },
        caption: {
          ...typography.caption,
          color: current.colors.textSecondary,
        },
        current: {
          ...typography.body,
          color: current.colors.textPrimary,
        },
        grid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.md,
        },
        card: {
          width: "47%",
          minHeight: 160,
          borderRadius: radii.lg,
          padding: spacing.md,
          borderWidth: 2,
          borderColor: "transparent",
        },
        cardSelected: {
          borderColor: current.colors.accent,
          shadowColor: current.colors.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
        },
        cardTop: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        },
        emoji: {
          fontSize: 22,
        },
        radio: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.25)",
          alignItems: "center",
          justifyContent: "center",
        },
        radioSelected: {
          borderColor: current.colors.accent,
        },
        check: {
          color: current.colors.accent,
          fontWeight: "800",
          fontSize: 14,
        },
        preview: {
          marginTop: spacing.sm,
          gap: spacing.sm,
        },
        previewDots: {
          flexDirection: "row",
          gap: spacing.sm,
        },
        dotA: {
          width: 18,
          height: 18,
          borderRadius: 9,
        },
        dotB: {
          width: 18,
          height: 18,
          borderRadius: 9,
        },
        previewLine: {
          height: 6,
          borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.12)",
        },
        previewLineShort: {
          width: "60%",
          height: 6,
          borderRadius: 3,
          backgroundColor: "rgba(255,255,255,0.08)",
        },
        cardFooter: {
          marginTop: "auto",
          paddingTop: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        cardName: {
          fontSize: 15,
          fontWeight: "700",
        },
      }),
    [current.colors]
  );

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.caption}>APPEARANCE</Text>
        <Text style={styles.current}>
          Current theme: {current.name} {current.emoji}
        </Text>
      </View>

      <View style={styles.grid}>
        {themeOrder.map((id) => {
          const t = getTheme(id);
          const selected = id === themeId;
          const isLight = t.isLight;
          const previewLineColor = isLight
            ? "rgba(44,24,16,0.12)"
            : "rgba(255,255,255,0.12)";
          const previewLineMuted = isLight
            ? "rgba(44,24,16,0.08)"
            : "rgba(255,255,255,0.08)";

          return (
            <Pressable
              key={id}
              onPress={() => setThemeId(id)}
              style={[
                styles.card,
                { backgroundColor: t.colors.background },
                selected && styles.cardSelected,
              ]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.emoji}>{t.emoji}</Text>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <Text style={styles.check}>✓</Text> : null}
                </View>
              </View>

              <View style={styles.preview}>
                <View style={styles.previewDots}>
                  <View
                    style={[styles.dotA, { backgroundColor: t.colors.surface2 }]}
                  />
                  <View
                    style={[styles.dotB, { backgroundColor: t.colors.accent }]}
                  />
                </View>
                <View style={[styles.previewLine, { backgroundColor: previewLineColor }]} />
                <View
                  style={[styles.previewLineShort, { backgroundColor: previewLineMuted }]}
                />
              </View>

              <View style={styles.cardFooter}>
                <Text style={[styles.cardName, { color: t.colors.textPrimary }]}>
                  {t.name}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
