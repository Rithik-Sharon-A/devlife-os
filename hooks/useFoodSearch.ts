import { useCallback, useState } from "react";
import { MMKV } from "react-native-mmkv";

import { indianFoods, searchFoods } from "../data/indianFoods";
import type { FoodItem } from "../types";
import { useAI } from "./useAI";

const OFF_CACHE_KEY_PREFIX = "off_search_";
const OFF_API =
  "https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&json=1&fields=product_name,nutriments,serving_size&page_size=15";

const offCacheMmkv = new MMKV({ id: "dayos-food-search" });

export type FoodSearchLayer = "local" | "api" | "ai_estimate" | "idle";

interface OpenFoodFactsProduct {
  product_name?: string;
  serving_size?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "energy-kcal_serving"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

interface OpenFoodFactsResponse {
  products?: OpenFoodFactsProduct[];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function cacheKey(query: string): string {
  return `${OFF_CACHE_KEY_PREFIX}${query.toLowerCase().trim()}`;
}

function getCachedOffResults(query: string): FoodItem[] | null {
  try {
    const raw = offCacheMmkv.getString(cacheKey(query));
    if (!raw) return null;
    return JSON.parse(raw) as FoodItem[];
  } catch {
    return null;
  }
}

function setCachedOffResults(query: string, items: FoodItem[]): void {
  try {
    offCacheMmkv.set(cacheKey(query), JSON.stringify(items));
  } catch {
    // ignore cache failures
  }
}

function mapOpenFoodFactsProduct(
  product: OpenFoodFactsProduct,
  index: number
): FoodItem | null {
  const name = product.product_name?.trim();
  if (!name) return null;

  const nutriments = product.nutriments ?? {};
  const calories = Math.round(
    nutriments["energy-kcal_serving"] ??
      nutriments["energy-kcal_100g"] ??
      0
  );

  if (calories <= 0) return null;

  return {
    id: `off_${index}_${generateId()}`,
    name,
    calories,
    protein: Math.round((nutriments.proteins_100g ?? 0) * 10) / 10,
    carbs: Math.round((nutriments.carbohydrates_100g ?? 0) * 10) / 10,
    fat: Math.round((nutriments.fat_100g ?? 0) * 10) / 10,
    servingSize: 1,
    servingUnit: product.serving_size?.trim() || "100g",
    category: "custom",
    tags: ["open_food_facts"],
    source: "api",
  };
}

export function useFoodSearch() {
  const { estimateFoodCalories } = useAI();

  const [results, setResults] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<FoodSearchLayer>("idle");

  const searchLocal = useCallback((query: string): FoodItem[] => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    return searchFoods(trimmed);
  }, []);

  const searchOpenFoodFacts = useCallback(
    async (query: string): Promise<FoodItem[]> => {
      const trimmed = query.trim();
      if (!trimmed) return [];

      const cached = getCachedOffResults(trimmed);
      if (cached) return cached;

      const url = OFF_API.replace(
        "{query}",
        encodeURIComponent(trimmed)
      );

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open Food Facts search failed (${response.status}).`);
      }

      const data = (await response.json()) as OpenFoodFactsResponse;
      const mapped =
        data.products
          ?.map((product, index) => mapOpenFoodFactsProduct(product, index))
          .filter((item): item is FoodItem => item !== null) ?? [];

      setCachedOffResults(trimmed, mapped);
      return mapped;
    },
    []
  );

  const estimateWithAI = useCallback(
    async (query: string, portion: string): Promise<FoodItem> => {
      return estimateFoodCalories(query, portion || "1 serving");
    },
    [estimateFoodCalories]
  );

  const search = useCallback(
    async (query: string, portion = "1 serving"): Promise<FoodItem[]> => {
      const trimmed = query.trim();
      if (!trimmed) {
        setResults([]);
        setActiveLayer("idle");
        setError(null);
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        setActiveLayer("local");
        const localResults = searchLocal(trimmed);
        if (localResults.length > 0) {
          setResults(localResults);
          return localResults;
        }

        setActiveLayer("api");
        const apiResults = await searchOpenFoodFacts(trimmed);
        if (apiResults.length > 0) {
          setResults(apiResults);
          return apiResults;
        }

        setActiveLayer("ai_estimate");
        const estimate = await estimateWithAI(trimmed, portion);
        const merged = [estimate];
        setResults(merged);
        return merged;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Food search failed.";
        setError(message);
        setResults([]);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [estimateWithAI, searchLocal, searchOpenFoodFacts]
  );

  return {
    results,
    isLoading,
    error,
    activeLayer,
    searchLocal,
    searchOpenFoodFacts,
    estimateWithAI,
    search,
    localDatabaseSize: indianFoods.length,
  };
}
