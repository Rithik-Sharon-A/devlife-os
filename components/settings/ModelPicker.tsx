import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getProvider,
  type ProviderModel,
} from "../../data/providers";
import type { AIProvider } from "../../types";
import { Input } from "../ui/Input";
import { uiTheme } from "../ui/theme";

interface ModelPickerProps {
  providerId: AIProvider;
  selectedModelId: string;
  onSelect: (modelId: string) => void;
}

function matchesSearch(model: ProviderModel, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    model.displayName.toLowerCase().includes(q) ||
    model.id.toLowerCase().includes(q)
  );
}

function ModelRow({
  model,
  selected,
  onPress,
}: {
  model: ProviderModel;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={styles.rowMain}>
        {selected ? <Text style={styles.check}>✓</Text> : <View style={styles.checkSpacer} />}
        <Text style={[styles.modelName, selected && styles.modelNameSelected]}>
          {model.displayName}
        </Text>
        {model.isFree ? (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>FREE</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function Section({
  title,
  models,
  selectedModelId,
  onSelect,
}: {
  title: string;
  models: ProviderModel[];
  selectedModelId: string;
  onSelect: (modelId: string) => void;
}) {
  if (models.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {models.map((model) => (
        <ModelRow
          key={model.id}
          model={model}
          selected={selectedModelId === model.id}
          onPress={() => onSelect(model.id)}
        />
      ))}
    </View>
  );
}

export function ModelPicker({
  providerId,
  selectedModelId,
  onSelect,
}: ModelPickerProps) {
  const [query, setQuery] = useState("");
  const provider = getProvider(providerId);

  const { freeModels, paidModels } = useMemo(() => {
    const filtered = provider.models.filter((m) => matchesSearch(m, query));
    return {
      freeModels: filtered.filter((m) => m.isFree),
      paidModels: filtered.filter((m) => !m.isFree),
    };
  }, [provider.models, query]);

  const hasResults = freeModels.length > 0 || paidModels.length > 0;

  return (
    <View style={styles.wrap}>
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder="Search models..."
        returnKeyType="search"
      />

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!hasResults ? (
          <Text style={styles.empty}>No models match your search.</Text>
        ) : (
          <>
            {freeModels.length > 0 ? (
              <Section
                title="FREE MODELS"
                models={freeModels}
                selectedModelId={selectedModelId}
                onSelect={onSelect}
              />
            ) : null}
            {paidModels.length > 0 ? (
              <Section
                title={freeModels.length > 0 ? "PAID MODELS" : "MODELS"}
                models={paidModels}
                selectedModelId={selectedModelId}
                onSelect={onSelect}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    gap: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
    gap: 16,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    color: uiTheme.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  row: {
    borderWidth: 1,
    borderColor: "#1e1e28",
    borderRadius: 14,
    backgroundColor: "#13131a",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowSelected: {
    borderColor: uiTheme.accent,
    borderWidth: 1.5,
  },
  rowMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  check: {
    color: uiTheme.accent,
    fontWeight: "700",
    fontSize: 14,
    width: 16,
  },
  checkSpacer: {
    width: 16,
  },
  modelName: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "400",
    flexShrink: 1,
    flex: 1,
  },
  modelNameSelected: {
    fontWeight: "600",
  },
  freeBadge: {
    backgroundColor: "rgba(52,211,153,0.12)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  freeBadgeText: {
    color: "#34d399",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  empty: {
    color: uiTheme.textSecondary,
    textAlign: "center",
    paddingVertical: 24,
    fontSize: 14,
  },
});
