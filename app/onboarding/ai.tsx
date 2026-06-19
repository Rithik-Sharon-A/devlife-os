import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ModelPicker } from "../../components/settings/ModelPicker";
import { OnboardingShell } from "../../components/onboarding/OnboardingShell";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { uiTheme } from "../../components/ui/theme";
import {
  findProviderModel,
  getDefaultModelForProvider,
  getProvider,
  PROVIDERS,
} from "../../data/providers";
import { finishOnboarding } from "../../store/finishOnboarding";
import { useAppStore } from "../../store/useAppStore";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import type { AIProvider } from "../../types";
import { testAIConnection } from "../../utils/onboarding/testAIConnection";
import { useOnboardingStep } from "./_layout";

const PROVIDER_ORDER: AIProvider[] = [
  "groq",
  "openrouter",
  "openai",
  "anthropic",
  "gemini",
  "ollama",
];

function providerBadge(id: AIProvider): string | null {
  if (id === "groq") return "Free & fastest";
  if (id === "openrouter") return "200+ models";
  if (PROVIDERS[id].freeModelsAvailable) return "Free available";
  return null;
}

const goalLabels: Record<string, string> = {
  weight_loss: "Lose weight",
  maintain: "Maintain",
  weight_gain: "Gain weight",
};

const activityLabels: Record<string, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly active",
  moderately_active: "Moderately active",
  very_active: "Very active",
};

export default function OnboardingAI() {
  const step = useOnboardingStep();
  const draft = useOnboardingStore();
  const { updateDraft, completeOnboarding } = useOnboardingStore();

  const [showFinish, setShowFinish] = useState(false);
  const [modelSheetOpen, setModelSheetOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const selectedProvider = draft.aiProvider
    ? getProvider(draft.aiProvider)
    : null;

  const activeModelId = draft.aiModel || (draft.aiProvider ? getDefaultModelForProvider(draft.aiProvider) : "");
  const activeModel = useMemo(() => {
    if (!draft.aiProvider || !activeModelId) return null;
    return findProviderModel(draft.aiProvider, activeModelId);
  }, [draft.aiProvider, activeModelId]);

  const selectProvider = (id: AIProvider) => {
    setTestResult(null);
    setTestError(null);
    updateDraft({
      aiProvider: id,
      aiModel: getDefaultModelForProvider(id),
      aiSkipped: false,
      aiApiKey: "",
    });
  };

  const onTest = async () => {
    if (!draft.aiProvider) return;
    setTesting(true);
    setTestResult(null);
    setTestError(null);

    const model = activeModelId;
    const result = await testAIConnection(draft.aiProvider, draft.aiApiKey, model);

    setTesting(false);
    if (result.success) {
      setTestResult("success");
      updateDraft({ aiModel: model });
    } else {
      setTestResult("error");
      setTestError(result.error ?? "Connection failed.");
    }
  };

  const onSkip = () => {
    updateDraft({ aiSkipped: true, aiProvider: null, aiApiKey: "" });
    setShowFinish(true);
  };

  const onContinueSetup = () => {
    if (!draft.aiProvider) return;
    const provider = getProvider(draft.aiProvider);
    if (provider.requiresKey && !draft.aiApiKey.trim()) return;
    updateDraft({
      aiSkipped: false,
      aiModel: activeModelId,
    });
    setShowFinish(true);
  };

  const onStartDay = () => {
    completeOnboarding();
    const app = useAppStore.getState();
    if (app.profile) {
      void finishOnboarding(app.profile, app.notificationConfig);
    }
    router.replace("/(tabs)");
  };

  if (showFinish) {
    return (
      <OnboardingShell step={step} showBack={false}>
        <Text style={styles.finishTitle}>You're all set, {draft.name}!</Text>
        <Text style={styles.finishSubtitle}>
          Your profile is saved locally. Let's make today count.
        </Text>

        <View style={styles.summaryList}>
          <SummaryCard
            label="Daily calories"
            value={`${draft.dailyCalorieGoal.toLocaleString()} kcal`}
          />
          <SummaryCard
            label="Water goal"
            value={`${draft.dailyGoalBottles} × ${draft.bottleSizeMl}ml`}
          />
          <SummaryCard
            label="Goal"
            value={goalLabels[draft.goalType] ?? draft.goalType}
          />
          <SummaryCard
            label="Activity"
            value={activityLabels[draft.activityLevel] ?? draft.activityLevel}
          />
          <SummaryCard
            label="Schedule"
            value={`Wake ${draft.wakeTime} · Sleep ${draft.sleepTime}`}
          />
          <SummaryCard
            label="AI coaching"
            value={
              draft.aiSkipped
                ? "Skipped"
                : draft.aiProvider
                  ? getProvider(draft.aiProvider).displayName
                  : "Not configured"
            }
          />
        </View>

        <View style={styles.finishFooter}>
          <Button label="Start my day →" onPress={onStartDay} size="lg" />
        </View>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step={step}
      footer={
        draft.aiProvider ? (
          <Button label="Continue" onPress={onContinueSetup} />
        ) : undefined
      }
    >
      <Text style={styles.title}>Add AI for personalized coaching</Text>
      <Text style={styles.subtitle}>
        Optional. Your key is stored only on this device.
      </Text>

      <View style={styles.providerGrid}>
        {PROVIDER_ORDER.map((id) => {
          const provider = PROVIDERS[id];
          const active = draft.aiProvider === id;
          const badge = providerBadge(id);

          return (
            <Pressable key={id} onPress={() => selectProvider(id)}>
              <Card
                variant={active ? "elevated" : "bordered"}
                style={[styles.providerCard, active && styles.providerCardActive]}
              >
                <Text style={styles.providerName}>{provider.displayName}</Text>
                {badge ? <Text style={styles.providerBadge}>{badge}</Text> : null}
              </Card>
            </Pressable>
          );
        })}
      </View>

      {selectedProvider ? (
        <View style={styles.setup}>
          <Text style={styles.setupTitle}>Setup {selectedProvider.displayName}</Text>
          <Text style={styles.instructions}>{selectedProvider.setupInstructions}</Text>

          {selectedProvider.requiresKey ? (
            <Input
              label="API key"
              value={draft.aiApiKey}
              onChangeText={(text) => {
                setTestResult(null);
                updateDraft({ aiApiKey: text });
              }}
              placeholder="sk-..."
            />
          ) : null}

          <Pressable
            style={styles.modelRow}
            onPress={() => setModelSheetOpen(true)}
            accessibilityRole="button"
          >
            <Text style={styles.modelRowLabel}>Model</Text>
            <View style={styles.modelRowRight}>
              <Text style={styles.modelRowValue} numberOfLines={1}>
                {activeModel?.displayName ?? "Select model"}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Pressable>

          <Button
            label="Test Connection"
            variant="secondary"
            onPress={onTest}
            loading={testing}
          />

          {testResult === "success" ? (
            <Text style={styles.testSuccess}>Connection successful</Text>
          ) : null}
          {testResult === "error" ? (
            <Text style={styles.testError}>{testError ?? "Connection failed"}</Text>
          ) : null}
        </View>
      ) : null}

      <Pressable onPress={onSkip} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>

      {draft.aiProvider ? (
        <BottomSheet
          visible={modelSheetOpen}
          onClose={() => setModelSheetOpen(false)}
          title="Select Model"
          height="full"
        >
          <ModelPicker
            providerId={draft.aiProvider}
            selectedModelId={activeModelId}
            onSelect={(modelId) => {
              updateDraft({ aiModel: modelId });
              setModelSheetOpen(false);
            }}
          />
        </BottomSheet>
      ) : null}
    </OnboardingShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="bordered" style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    color: uiTheme.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    marginTop: 12,
  },
  subtitle: {
    color: uiTheme.textSecondary,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  providerGrid: {
    marginTop: 20,
    gap: 8,
  },
  providerCard: {
    gap: 4,
    paddingVertical: 12,
  },
  providerCardActive: {
    borderWidth: 1.5,
    borderColor: uiTheme.accent,
  },
  providerName: {
    color: uiTheme.textPrimary,
    fontWeight: "600",
    fontSize: 15,
  },
  providerBadge: {
    color: uiTheme.textSecondary,
    fontSize: 12,
  },
  setup: {
    marginTop: 20,
    gap: 12,
  },
  setupTitle: {
    color: uiTheme.textPrimary,
    fontWeight: "600",
    fontSize: 15,
  },
  instructions: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#13131a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1e1e28",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  modelRowLabel: {
    color: "#e2e8f0",
    fontSize: 15,
    fontWeight: "400",
  },
  modelRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    maxWidth: "62%",
  },
  modelRowValue: {
    color: "#6b7280",
    fontSize: 15,
    flexShrink: 1,
    textAlign: "right",
  },
  chevron: {
    fontSize: 18,
    color: "#4a4a5a",
  },
  testSuccess: {
    color: uiTheme.success,
    fontWeight: "600",
    fontSize: 14,
  },
  testError: {
    color: uiTheme.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  skipBtn: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    color: uiTheme.textSecondary,
    fontWeight: "500",
    fontSize: 15,
  },
  finishTitle: {
    color: uiTheme.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    marginTop: 16,
    lineHeight: 34,
  },
  finishSubtitle: {
    color: uiTheme.textSecondary,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  summaryList: {
    marginTop: 24,
    gap: 8,
  },
  summaryCard: {
    marginBottom: 0,
  },
  summaryLabel: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  summaryValue: {
    color: uiTheme.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },
  finishFooter: {
    marginTop: 28,
    marginBottom: 12,
  },
});
