import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { FoodItem, MealEntry, MealType } from "../../types";
import { useAppStore } from "../../store/useAppStore";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { uiTheme } from "../ui/theme";

interface QuantityPickerProps {
  item: FoodItem;
  mealType: MealType;
  onDone?: () => void;
}

const quickValues = [0.5, 1, 1.5, 2, 2.5, 3];

function id(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function QuantityPicker({ item, mealType, onDone }: QuantityPickerProps) {
  const addMealEntry = useAppStore((s) => s.addMealEntry);
  const [quantity, setQuantity] = useState(1);
  const [custom, setCustom] = useState("1");

  const calories = useMemo(
    () => Math.round(item.calories * quantity),
    [item.calories, quantity]
  );

  const applyCustom = (value: string) => {
    setCustom(value);
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setQuantity(parsed);
    }
  };

  const add = () => {
    const entry: MealEntry = {
      id: id(),
      foodItem: item,
      quantity,
      mealType,
      timestamp: new Date().toISOString(),
      calories,
    };
    addMealEntry(entry);
    onDone?.();
  };

  return (
    <View>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.sub}>Choose quantity</Text>

      <View style={styles.row}>
        {quickValues.map((value) => (
          <Button
            key={value}
            label={`${value}`}
            variant={quantity === value ? "primary" : "secondary"}
            size="sm"
            onPress={() => {
              setQuantity(value);
              setCustom(String(value));
            }}
          />
        ))}
      </View>

      <Input
        label="Custom quantity"
        value={custom}
        onChangeText={applyCustom}
        placeholder="e.g. 1.25"
        keyboardType="decimal-pad"
      />

      <Text style={styles.total}>Calculated calories: {calories} kcal</Text>

      <Button label={`Add to ${mealType}`} onPress={add} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: uiTheme.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  sub: {
    color: uiTheme.textSecondary,
    marginTop: 4,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  total: {
    marginVertical: 12,
    color: uiTheme.textPrimary,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
