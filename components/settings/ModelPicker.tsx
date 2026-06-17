import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getModelContextSubtitle,
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
  providerName,
  selected,
  onPress,
}: {
  model: ProviderModel;
  providerName: string;
  selected: boolean;
  onPress: () => void;
}) {
  const context = getModelContextSubtitle(model);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={styles.rowMain}>
        <View style={styles.titleRow}>
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
        <Text style={styles.subtitle}>
          {context} · {providerName}
        </Text>
      </View>
    </Pressable>
  );
}

function Section({
  title,
  models,
  providerName,
  selectedModelId,
  onSelect,
}: {
  title: string;
  models: ProviderModel[];
  providerName: string;
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
          providerName={providerName}
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
            <Section
              title="FREE MODELS"
              models={freeModels}
              providerName={provider.displayName}
              selectedModelId={selectedModelId}
              onSelect={onSelect}
            />
            <Section
              title="PAID MODELS"
              models={paidModels}
              providerName={provider.displayName}
              selectedModelId={selectedModelId}
              onSelect={onSelect}
            />
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
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  row: {
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusInput,
    backgroundColor: uiTheme.surface2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowSelected: {
    borderColor: uiTheme.accent,
    backgroundColor: `${uiTheme.accent}18`,
  },
  rowMain: {
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  check: {
    color: uiTheme.accent,
    fontWeight: "800",
    fontSize: 14,
    width: 16,
  },
  checkSpacer: {
    width: 16,
  },
  modelName: {
    color: uiTheme.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  modelNameSelected: {
    color: uiTheme.accent,
    fontWeight: "700",
  },
  freeBadge: {
    backgroundColor: `${uiTheme.success}22`,
    borderWidth: 1,
    borderColor: `${uiTheme.success}66`,
    borderRadius: uiTheme.radiusPill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  freeBadgeText: {
    color: uiTheme.success,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  subtitle: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    marginLeft: 24,
  },
  empty: {
    color: uiTheme.textSecondary,
    textAlign: "center",
    paddingVertical: 24,
    fontSize: 14,
  },
});
