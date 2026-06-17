import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useFoodSearch } from "../../hooks/useFoodSearch";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { FoodItem, MealType } from "../../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { SegmentedControl } from "../ui/SegmentedControl";
import { uiTheme } from "../ui/theme";
import { FoodResultItem } from "./FoodResultItem";
import { QuantityPicker } from "./QuantityPicker";

type SearchTab = "Local" | "Online" | "AI Estimate";

interface AddMealSheetProps {
  mealType: MealType;
  onDone?: () => void;
}

export function AddMealSheet({ mealType, onDone }: AddMealSheetProps) {
  const { searchLocal, searchOpenFoodFacts, estimateWithAI } = useFoodSearch();

  const [tab, setTab] = useState<SearchTab>("Local");
  const [query, setQuery] = useState("");
  const [portion, setPortion] = useState("1 serving");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodItem | null>(null);

  const runSearch = useCallback(
    async (text: string, activeTab: SearchTab) => {
      const trimmed = text.trim();
      if (trimmed.length < 2 && activeTab !== "AI Estimate") {
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (activeTab === "Local") {
          setResults(searchLocal(trimmed));
        } else if (activeTab === "Online") {
          setResults(await searchOpenFoodFacts(trimmed));
        } else {
          if (!trimmed) {
            setError("Describe what you ate.");
            setResults([]);
            return;
          }
          const estimate = await estimateWithAI(trimmed, portion || "1 serving");
          setResults([estimate]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed.");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [estimateWithAI, searchLocal, searchOpenFoodFacts]
  );

  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    if (tab !== "AI Estimate" && debouncedQuery.trim().length >= 2) {
      void runSearch(debouncedQuery, tab);
    }
  }, [debouncedQuery, tab, runSearch]);

  const onQueryChange = (text: string) => {
    setQuery(text);
  };

  const onTabChange = (label: string) => {
    const next = label as SearchTab;
    setTab(next);
    setResults([]);
    setError(null);
    setSelected(null);
    if (next !== "AI Estimate" && query.trim().length >= 2) {
      void runSearch(query, next);
    }
  };

  if (selected) {
    return (
      <QuantityPicker
        item={selected}
        mealType={mealType}
        onDone={() => {
          setSelected(null);
          setQuery("");
          setResults([]);
          onDone?.();
        }}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <SegmentedControl
        options={["Local", "Online", "AI Estimate"]}
        selected={tab}
        onChange={onTabChange}
      />

      <Input
        value={query}
        onChangeText={onQueryChange}
        placeholder={
          tab === "AI Estimate"
            ? "e.g. 2 rotis with dal and sabzi"
            : "Search food (e.g. idli, paneer...)"
        }
        returnKeyType={tab === "AI Estimate" ? "default" : "search"}
        autoFocus
      />

      {tab === "AI Estimate" ? (
        <>
          <Input
            value={portion}
            onChangeText={setPortion}
            placeholder="Portion size"
            label="Portion"
          />
          <Button
            label="Estimate calories"
            onPress={() => void runSearch(query, tab)}
            loading={isLoading}
          />
        </>
      ) : null}

      <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={uiTheme.accent} />
            <Text style={styles.layerText}>
              {tab === "Local"
                ? "Searching local database..."
                : tab === "Online"
                  ? "Searching Open Food Facts..."
                  : "Estimating with AI..."}
            </Text>
          </View>
        ) : null}

        {!isLoading && error ? <Text style={styles.error}>{error}</Text> : null}

        {!isLoading && !error && results.length === 0 && query.trim().length >= 2 ? (
          <Text style={styles.empty}>No matches found.</Text>
        ) : null}

        {!isLoading &&
          results.map((item) => (
            <FoodResultItem key={item.id} item={item} onPress={setSelected} />
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    gap: 12,
  },
  results: {
    flex: 1,
    marginTop: 4,
  },
  center: {
    alignItems: "center",
    paddingVertical: 20,
  },
  layerText: {
    color: uiTheme.textSecondary,
    marginTop: 8,
    fontSize: 12,
  },
  empty: {
    color: uiTheme.textSecondary,
    textAlign: "center",
    paddingVertical: 16,
  },
  error: {
    color: uiTheme.danger,
    paddingVertical: 8,
  },
});
