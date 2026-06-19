import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { UndoDeleteToast } from "../../../components/food/UndoDeleteToast";
import { Button } from "../../../components/ui/Button";
import { uiTheme } from "../../../components/ui/theme";
import { useAppStore } from "../../../store/useAppStore";
import type { MealEntry } from "../../../types";
import {
  MEAL_TITLES,
  navigateToAddMeal,
  parseMealParam,
} from "../../../utils/foodNavigation";

export default function MealDetailScreen() {
  const { meal } = useLocalSearchParams<{ meal?: string }>();
  const mealType = parseMealParam(meal);
  const title = MEAL_TITLES[mealType];

  const allEntries = useAppStore((s) => s.todayFoodLog.entries);
  const removeMealEntry = useAppStore((s) => s.removeMealEntry);
  const addMealEntry = useAppStore((s) => s.addMealEntry);

  const [undoEntry, setUndoEntry] = useState<MealEntry | null>(null);

  const entries = useMemo(
    () => allEntries.filter((e) => e.mealType === mealType),
    [allEntries, mealType]
  );

  const total = entries.reduce((sum, e) => sum + e.calories, 0);

  const handleDelete = useCallback(
    (entry: MealEntry) => {
      removeMealEntry(entry.id);
      setUndoEntry(entry);
    },
    [removeMealEntry]
  );

  const handleUndo = useCallback(() => {
    if (undoEntry) {
      addMealEntry(undoEntry);
      setUndoEntry(null);
    }
  }, [addMealEntry, undoEntry]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSub}>{total} kcal · {entries.length} items</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No items logged yet</Text>
            <Text style={styles.emptySub}>Add your first item for {title.toLowerCase()}.</Text>
            <Button
              label="+ Add item"
              onPress={() => navigateToAddMeal(mealType)}
            />
          </View>
        ) : (
          <>
            {entries.map((entry) => (
              <View key={entry.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{entry.foodItem.name}</Text>
                  <Text style={styles.itemMeta}>
                    x{entry.quantity} · {entry.calories} kcal
                  </Text>
                </View>
                <Pressable
                  onPress={() => handleDelete(entry)}
                  style={styles.deleteBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${entry.foodItem.name}`}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </Pressable>
              </View>
            ))}

            <Pressable
              style={styles.inlineAdd}
              onPress={() => navigateToAddMeal(mealType)}
            >
              <Text style={styles.inlineAddPlus}>+</Text>
              <Text style={styles.inlineAddText}>Add item to {title}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <UndoDeleteToast
        visible={undoEntry !== null}
        foodName={undoEntry?.foodItem.name ?? ""}
        onUndo={handleUndo}
        onDismiss={() => setUndoEntry(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: uiTheme.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: {
    color: uiTheme.textPrimary,
    fontSize: 22,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: uiTheme.textPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  headerSub: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    color: uiTheme.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  emptySub: {
    color: uiTheme.textSecondary,
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.border,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    color: uiTheme.textPrimary,
    fontWeight: "600",
    fontSize: 15,
  },
  itemMeta: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    color: "#f87171",
    fontSize: 13,
    fontWeight: "600",
  },
  inlineAdd: {
    width: "100%",
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(124, 106, 255, 0.3)",
    borderRadius: 8,
    marginTop: 16,
  },
  inlineAddPlus: {
    color: uiTheme.accent,
    fontSize: 16,
    fontWeight: "700",
  },
  inlineAddText: {
    fontSize: 13,
    color: uiTheme.accent,
    fontWeight: "600",
  },
});
