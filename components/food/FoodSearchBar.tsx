import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useFoodSearch } from "../../hooks/useFoodSearch";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { FoodItem } from "../../types";
import { BottomSheet } from "../ui/BottomSheet";
import { Input } from "../ui/Input";
import { uiTheme } from "../ui/theme";
import { FoodResultItem } from "./FoodResultItem";
import { QuantityPicker } from "./QuantityPicker";
import type { MealType } from "../../types";

interface FoodSearchBarProps {
  mealType: MealType;
}

export function FoodSearchBar({ mealType }: FoodSearchBarProps) {
  const { search, results, activeLayer, isLoading, error } = useFoodSearch();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const debouncedQuery = useDebouncedValue(query, 300);

  const hasDropdown = query.trim().length > 1;

  const layerLabel = useMemo(() => {
    if (activeLayer === "local") return "Searching local database...";
    if (activeLayer === "api") return "Searching Open Food Facts...";
    if (activeLayer === "ai_estimate") return "Estimating with AI...";
    return "";
  }, [activeLayer]);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length > 1) void search(trimmed);
  }, [debouncedQuery, search]);

  return (
    <View style={styles.wrap}>
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Search food (e.g. idli, paneer...)"
        returnKeyType="search"
      />

      {hasDropdown ? (
        <View style={styles.dropdown}>
          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={uiTheme.accent} />
              <Text style={styles.layerText}>{layerLabel}</Text>
            </View>
          ) : null}

          {!isLoading && error ? <Text style={styles.error}>{error}</Text> : null}

          {!isLoading && !error && results.length === 0 ? (
            <Text style={styles.empty}>No matches found.</Text>
          ) : null}

          {!isLoading &&
            results.map((item) => (
              <FoodResultItem key={item.id} item={item} onPress={setSelected} />
            ))}
        </View>
      ) : null}

      <BottomSheet
        visible={selected !== null}
        onClose={() => setSelected(null)}
        title="Add food"
        height="half"
      >
        {selected ? (
          <QuantityPicker
            item={selected}
            mealType={mealType}
            onDone={() => {
              setSelected(null);
              setQuery("");
            }}
          />
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: uiTheme.surface1,
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusCard,
    maxHeight: 320,
    padding: 10,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  layerText: {
    color: uiTheme.textSecondary,
    marginTop: 6,
    fontSize: 12,
  },
  empty: {
    color: uiTheme.textSecondary,
    paddingVertical: 12,
    textAlign: "center",
  },
  error: {
    color: uiTheme.danger,
    paddingVertical: 8,
  },
});
