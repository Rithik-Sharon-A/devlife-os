import { router } from "expo-router";
import { useMemo, useState } from "react";
import { finishOnboarding } from "../../store/finishOnboarding";
import { useAppStore } from "../../store/useAppStore";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { uiTheme } from "../../components/ui/theme";
import { getProvider, PROVIDERS } from "../../data/providers";
import type { AIProvider } from "../../types";
import { useOnboardingStore } from "../../store/useOnboardingStore";
import { OnboardingShell } from "./components/OnboardingShell";
import { useOnboardingStep } from "./_layout";
import { testAIConnection } from "./utils/testAIConnection";

const PROVIDER_ORDER: AIProvider[] = [
  "groq",
  "openrouter",
  "openai",
  "anthropic",
  "gemini",
  "ollama",
];

const PROVIDER_ICONS: Record<AIProvider, string> = {
  groq: "⚡",
  openrouter: "🌐",
  openai: "🤖",
  anthropic: "🧠",
  gemini: "✨",
  ollama: "🦙",
};

function providerBadge(id: AIProvider): string | null {
  if (id === "groq") return "⚡ Free & Fastest";
  if (id === "openrouter") return "🌐 200+ models";
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
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const selectedProvider = draft.aiProvider
    ? getProvider(draft.aiProvider)
    : null;

  const defaultModel = useMemo(() => {
    if (!selectedProvider) return "";
    const free = selectedProvider.models.find((m) => m.isFree);
    return free?.id ?? selectedProvider.models[0]?.id ?? "";
  }, [selectedProvider]);

  const selectProvider = (id: AIProvider) => {
    const provider = getProvider(id);
    const model =
      provider.models.find((m) => m.isFree)?.id ?? provider.models[0]?.id ?? "";
    setTestResult(null);
    setTestError(null);
    updateDraft({
      aiProvider: id,
      aiModel: model,
      aiSkipped: false,
      aiApiKey: "",
    });
  };

  const onTest = async () => {
    if (!draft.aiProvider) return;
    setTesting(true);
    setTestResult(null);
    setTestError(null);

    const model = draft.aiModel || defaultModel;
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
      aiModel: draft.aiModel || defaultModel,
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
        <Text style={styles.finishTitle}>You're all set, {draft.name}! 🎉</Text>
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
                <View style={styles.providerHeader}>
                  <Text style={styles.providerIcon}>{PROVIDER_ICONS[id]}</Text>
                  <Text style={styles.providerName}>{provider.displayName}</Text>
                </View>
                {badge ? (
                  <Badge
                    label={badge}
                    color={id === "groq" ? uiTheme.warning : uiTheme.accent}
                  />
                ) : null}
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

          <Text style={styles.modelLabel}>Model</Text>
          <View style={styles.modelChips}>
            {selectedProvider.models.slice(0, 4).map((model) => {
              const active = (draft.aiModel || defaultModel) === model.id;
              return (
                <Pressable
                  key={model.id}
                  onPress={() => updateDraft({ aiModel: model.id })}
                  style={[styles.modelChip, active && styles.modelChipActive]}
                >
                  <Text
                    style={[styles.modelChipText, active && styles.modelChipTextActive]}
                  >
                    {model.displayName}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button
            label="Test Connection"
            variant="secondary"
            onPress={onTest}
            loading={testing}
          />

          {testResult === "success" ? (
            <Text style={styles.testSuccess}>✓ Working</Text>
          ) : null}
          {testResult === "error" ? (
            <Text style={styles.testError}>✗ {testError ?? "Connection failed"}</Text>
          ) : null}
        </View>
      ) : null}

      <Pressable onPress={onSkip} style={styles.skipBtn}>
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>
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
    fontWeight: "800",
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
    gap: 10,
  },
  providerCard: {
    gap: 8,
  },
  providerCardActive: {
    borderWidth: 1,
    borderColor: uiTheme.accent,
  },
  providerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  providerIcon: {
    fontSize: 22,
  },
  providerName: {
    color: uiTheme.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  setup: {
    marginTop: 20,
    gap: 12,
  },
  setupTitle: {
    color: uiTheme.textPrimary,
    fontWeight: "700",
    fontSize: 16,
  },
  instructions: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  modelLabel: {
    color: uiTheme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  modelChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modelChip: {
    borderWidth: 1,
    borderColor: uiTheme.border,
    borderRadius: uiTheme.radiusPill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: uiTheme.surface2,
  },
  modelChipActive: {
    borderColor: uiTheme.accent,
    backgroundColor: uiTheme.surface3,
  },
  modelChipText: {
    color: uiTheme.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  modelChipTextActive: {
    color: uiTheme.textPrimary,
  },
  testSuccess: {
    color: uiTheme.success,
    fontWeight: "700",
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
    fontWeight: "600",
    fontSize: 15,
  },
  finishTitle: {
    color: uiTheme.textPrimary,
    fontSize: 30,
    fontWeight: "800",
    marginTop: 16,
    lineHeight: 36,
  },
  finishSubtitle: {
    color: uiTheme.textSecondary,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  summaryList: {
    marginTop: 24,
    gap: 10,
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
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  finishFooter: {
    marginTop: 28,
    marginBottom: 12,
  },
});
