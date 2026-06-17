import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { testAIConnection } from "../../utils/onboarding/testAIConnection";
import { ThemePicker } from "../../components/settings/ThemePicker";
import {
  SettingsRow,
  SettingsSection,
  SettingsToggle,
} from "../../components/settings/SettingsSection";
import { ModelPicker } from "../../components/settings/ModelPicker";
import { TimePickerField } from "../../components/onboarding/TimePickerField";
import { Badge } from "../../components/ui/Badge";
import { BottomSheet } from "../../components/ui/BottomSheet";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { uiTheme } from "../../components/ui/theme";
import { findProviderModel, PROVIDERS } from "../../data/providers";
import { useToast } from "../../hooks/useToast";
import { useAppStore } from "../../store/useAppStore";
import type {
  ActivityLevel,
  AIProvider,
  GoalType,
  NotificationConfig,
} from "../../types";
import { formatHeight, formatWeight, parseHeightInputCm, parseWeightInput } from "../../utils/units";
import * as storage from "../../utils/storage";

const GOAL_LABELS: Record<GoalType, string> = {
  weight_loss: "Weight Loss",
  maintain: "Maintain",
  weight_gain: "Gain Weight",
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly Active",
  moderately_active: "Moderately Active",
  very_active: "Very Active",
};

const PROVIDER_ORDER: AIProvider[] = [
  "groq",
  "openrouter",
  "openai",
  "anthropic",
  "gemini",
  "ollama",
];

type SheetKind =
  | "profile"
  | "height"
  | "weight"
  | "goalWeight"
  | "goalType"
  | "activity"
  | "calorieOverride"
  | "bottleSize"
  | "waterGoal"
  | "focusWork"
  | "focusBreak"
  | "focusSessions"
  | "focusLongBreak"
  | "stepGoal"
  | "provider"
  | "model"
  | "apiKey"
  | "baseUrl"
  | null;

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function SettingsScreen() {
  const profile = useAppStore((s) => s.profile);
  const waterConfig = useAppStore((s) => s.waterConfig);
  const focusConfig = useAppStore((s) => s.focusConfig);
  const aiConfig = useAppStore((s) => s.aiConfig);
  const appPreferences = useAppStore((s) => s.appPreferences);
  const notificationConfig = useAppStore((s) => s.notificationConfig);

  const updateProfile = useAppStore((s) => s.updateProfile);
  const logWeight = useAppStore((s) => s.logWeight);
  const updateWaterConfig = useAppStore((s) => s.updateWaterConfig);
  const updateFocusConfig = useAppStore((s) => s.updateFocusConfig);
  const updateAppPreferences = useAppStore((s) => s.updateAppPreferences);
  const updateStepGoal = useAppStore((s) => s.updateStepGoal);
  const setNotificationConfig = useAppStore((s) => s.setNotificationConfig);
  const setAIConfig = useAppStore((s) => s.setAIConfig);
  const recalculateTDEE = useAppStore((s) => s.recalculateTDEE);
  const resetTodayData = useAppStore((s) => s.resetTodayData);
  const clearAllDataAndRestart = useAppStore((s) => s.clearAllDataAndRestart);
  const initializeStore = useAppStore((s) => s.initializeStore);

  const { showToast } = useToast();

  const [sheet, setSheet] = useState<SheetKind>(null);
  const [notifDraft, setNotifDraft] = useState<NotificationConfig>(notificationConfig);
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiTestStatus, setAiTestStatus] = useState<string | null>(null);
  const [aiTesting, setAiTesting] = useState(false);

  const [editName, setEditName] = useState(profile?.name ?? "");
  const [editAge, setEditAge] = useState(String(profile?.age ?? ""));
  const [editHeight, setEditHeight] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editGoalWeight, setEditGoalWeight] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editApiKey, setEditApiKey] = useState(aiConfig?.apiKey ?? "");
  const [editBaseUrl, setEditBaseUrl] = useState(aiConfig?.baseURL ?? "");

  useEffect(() => {
    setNotifDraft(notificationConfig);
  }, [notificationConfig]);

  const closeSheet = () => setSheet(null);

  const openSheet = (kind: SheetKind, seed = "") => {
    setEditNumber(seed);
    if (kind === "profile") {
      setEditName(profile?.name ?? "");
      setEditAge(String(profile?.age ?? ""));
    }
    if (kind === "height" && profile) {
      setEditHeight(
        appPreferences.heightUnit === "cm"
          ? String(profile.heightCm)
          : formatHeight(profile.heightCm, "ft").replace('"', '"')
      );
    }
    if (kind === "weight" && profile) {
      setEditWeight(
        appPreferences.weightUnit === "kg"
          ? String(profile.weightKg)
          : String(Math.round(profile.weightKg * 2.20462))
      );
    }
    if (kind === "goalWeight" && profile) {
      setEditGoalWeight(
        appPreferences.weightUnit === "kg"
          ? String(profile.goalWeightKg)
          : String(Math.round(profile.goalWeightKg * 2.20462))
      );
    }
    if (kind === "apiKey") setEditApiKey(aiConfig?.apiKey ?? "");
    if (kind === "baseUrl") setEditBaseUrl(aiConfig?.baseURL ?? "");
    setSheet(kind);
  };

  const calorieDisplay = useMemo(() => {
    if (!profile) return "—";
    return `${profile.dailyCalorieGoal.toLocaleString()} kcal`;
  }, [profile]);

  const modelDisplayName = useMemo(() => {
    if (!aiConfig?.model) return "—";
    const match = findProviderModel(aiConfig.provider, aiConfig.model);
    return match?.displayName ?? aiConfig.model;
  }, [aiConfig]);

  const sheetTitle =
    sheet === "model"
      ? "Select Model"
      : sheet === "provider"
        ? "Select Provider"
        : "Edit";

  const sheetHeight = sheet === "model" ? "full" : "half";

  const runAiTest = async () => {
    if (!aiConfig) return;
    setAiTesting(true);
    setAiTestStatus(null);
    const started = Date.now();
    const result = await testAIConnection(
      aiConfig.provider,
      aiConfig.apiKey,
      aiConfig.model
    );
    const latency = Date.now() - started;
    setAiTesting(false);
    if (result.success) {
      setAiTestStatus(`✓ Connected (${latency}ms)`);
      setAIConfig({ ...aiConfig, isConnected: true });
      showToast("AI connection successful", "success");
    } else {
      setAiTestStatus(`✗ ${result.error ?? "Failed"}`);
      setAIConfig({ ...aiConfig, isConnected: false });
    }
  };

  const saveNotifications = async () => {
    setNotificationConfig(notifDraft);
    void useAppStore.getState().persistAll?.();
    showToast("Notifications updated", "success");
  };

  const exportData = async () => {
    const json = await storage.exportAllData();
    await Share.share({ message: json, title: "dayos-export.json" });
    showToast("Data export ready to share");
  };

  const confirmResetToday = () => {
    Alert.alert(
      "Reset today's data?",
      "This clears today's food, water, habits, mood, and activity logs.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            resetTodayData();
            showToast("Today's data reset");
          },
        },
      ]
    );
  };

  const confirmClearAll = () => {
    Alert.alert(
      "Clear all data?",
      "This permanently deletes everything and returns you to onboarding.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear everything",
          style: "destructive",
          onPress: async () => {
            clearAllDataAndRestart();
            await initializeStore();
            showToast("All data cleared");
            router.replace("/onboarding");
          },
        },
      ]
    );
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Complete onboarding to access settings.</Text>
          <Button label="Go to onboarding" onPress={() => router.replace("/onboarding")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Badge label={GOAL_LABELS[profile.goalType]} color={uiTheme.accent} />
          <Button label="Edit Profile" variant="secondary" onPress={() => openSheet("profile")} />
        </View>

        <SettingsSection title="Appearance">
          <View style={{ paddingHorizontal: 14, paddingBottom: 16 }}>
            <ThemePicker />
          </View>
        </SettingsSection>

        <SettingsSection title="Body & Goals">
          <SettingsRow
            label="Height"
            value={formatHeight(profile.heightCm, appPreferences.heightUnit)}
            onPress={() => openSheet("height")}
          />
          <SettingsRow
            label="Current Weight"
            value={formatWeight(profile.weightKg, appPreferences.weightUnit)}
            onPress={() => openSheet("weight")}
          />
          <SettingsRow
            label="Goal Weight"
            value={formatWeight(profile.goalWeightKg, appPreferences.weightUnit)}
            onPress={() => openSheet("goalWeight")}
          />
          <SettingsRow
            label="Goal Type"
            value={GOAL_LABELS[profile.goalType]}
            onPress={() => openSheet("goalType")}
          />
          <SettingsRow
            label="Activity Level"
            value={ACTIVITY_LABELS[profile.activityLevel]}
            onPress={() => openSheet("activity")}
          />
          <SettingsRow
            label="Daily Calorie Goal"
            value={calorieDisplay}
            onPress={() => openSheet("calorieOverride")}
          />
          <SettingsToggle
            label="Manual calorie override"
            enabled={appPreferences.manualCalorieOverride}
            onToggle={() => {
              updateAppPreferences({
                manualCalorieOverride: !appPreferences.manualCalorieOverride,
              });
              recalculateTDEE();
              showToast("Calorie override updated");
            }}
          />
          <View style={styles.inlineBtn}>
            <Button
              label="Recalculate TDEE"
              variant="secondary"
              size="sm"
              onPress={() => {
                recalculateTDEE();
                showToast("TDEE recalculated");
              }}
            />
          </View>
        </SettingsSection>

        <SettingsSection title="Water">
          <SettingsRow
            label="Bottle Size"
            value={`${waterConfig.bottleSizeMl} ml`}
            onPress={() => openSheet("bottleSize", String(waterConfig.bottleSizeMl))}
          />
          <SettingsRow
            label="Daily Goal"
            value={`${waterConfig.dailyGoalBottles} bottles`}
            onPress={() => openSheet("waterGoal", String(waterConfig.dailyGoalBottles))}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Focus Timer">
          <SettingsRow
            label="Work Session"
            value={`${focusConfig.workMinutes} min`}
            onPress={() => openSheet("focusWork", String(focusConfig.workMinutes))}
          />
          <SettingsRow
            label="Break"
            value={`${focusConfig.breakMinutes} min`}
            onPress={() => openSheet("focusBreak", String(focusConfig.breakMinutes))}
          />
          <SettingsRow
            label="Sessions before long break"
            value={String(focusConfig.sessionsBeforeLongBreak)}
            onPress={() =>
              openSheet("focusSessions", String(focusConfig.sessionsBeforeLongBreak))
            }
          />
          <SettingsRow
            label="Long break"
            value={`${focusConfig.longBreakMinutes} min`}
            onPress={() => openSheet("focusLongBreak", String(focusConfig.longBreakMinutes))}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Step Counter">
          <SettingsRow
            label="Daily step goal"
            value={appPreferences.stepGoal.toLocaleString()}
            onPress={() => openSheet("stepGoal", String(appPreferences.stepGoal))}
          />
          <SettingsToggle
            label="Show steps on dashboard"
            enabled={appPreferences.showStepsOnDashboard}
            onToggle={() => {
              updateAppPreferences({
                showStepsOnDashboard: !appPreferences.showStepsOnDashboard,
              });
              showToast("Dashboard preference saved");
            }}
            isLast
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsToggle
            label="💧 Water Reminders"
            enabled={notifDraft.waterReminder.enabled}
            onToggle={() =>
              setNotifDraft((c) => ({
                ...c,
                waterReminder: {
                  ...c.waterReminder,
                  enabled: !c.waterReminder.enabled,
                },
              }))
            }
          />
          <View style={styles.timeList}>
            {notifDraft.waterReminder.times.map((time, index) => (
              <TimePickerField
                key={`water-${index}`}
                label={`Water reminder ${index + 1}`}
                value={time}
                onChange={(t) => {
                  const times = [...notifDraft.waterReminder.times];
                  times[index] = t;
                  setNotifDraft((c) => ({
                    ...c,
                    waterReminder: { ...c.waterReminder, times },
                  }));
                }}
              />
            ))}
          </View>
          <SettingsToggle
            label="🍽️ Meal Reminders"
            enabled={notifDraft.mealReminder.enabled}
            onToggle={() =>
              setNotifDraft((c) => ({
                ...c,
                mealReminder: { ...c.mealReminder, enabled: !c.mealReminder.enabled },
              }))
            }
          />
          {notifDraft.mealReminder.enabled ? (
            <View style={styles.timeList}>
              <TimePickerField
                label="Breakfast"
                value={notifDraft.mealReminder.breakfastTime}
                onChange={(time) =>
                  setNotifDraft((c) => ({
                    ...c,
                    mealReminder: { ...c.mealReminder, breakfastTime: time },
                  }))
                }
              />
              <TimePickerField
                label="Lunch"
                value={notifDraft.mealReminder.lunchTime}
                onChange={(time) =>
                  setNotifDraft((c) => ({
                    ...c,
                    mealReminder: { ...c.mealReminder, lunchTime: time },
                  }))
                }
              />
              <TimePickerField
                label="Dinner"
                value={notifDraft.mealReminder.dinnerTime}
                onChange={(time) =>
                  setNotifDraft((c) => ({
                    ...c,
                    mealReminder: { ...c.mealReminder, dinnerTime: time },
                  }))
                }
              />
            </View>
          ) : null}
          <SettingsToggle
            label="⏱️ Focus Reminder"
            enabled={notifDraft.focusReminder.enabled}
            onToggle={() =>
              setNotifDraft((c) => ({
                ...c,
                focusReminder: {
                  ...c.focusReminder,
                  enabled: !c.focusReminder.enabled,
                },
              }))
            }
          />
          <TimePickerField
            label="Focus reminder time"
            value={notifDraft.focusReminder.time}
            onChange={(time) =>
              setNotifDraft((c) => ({
                ...c,
                focusReminder: { ...c.focusReminder, time },
              }))
            }
          />
          <SettingsToggle
            label="🌙 Evening Check-in"
            enabled={notifDraft.eveningCheckin.enabled}
            onToggle={() =>
              setNotifDraft((c) => ({
                ...c,
                eveningCheckin: {
                  ...c.eveningCheckin,
                  enabled: !c.eveningCheckin.enabled,
                },
              }))
            }
          />
          <TimePickerField
            label="Evening check-in time"
            value={notifDraft.eveningCheckin.time}
            onChange={(time) =>
              setNotifDraft((c) => ({
                ...c,
                eveningCheckin: { ...c.eveningCheckin, time },
              }))
            }
          />
          <SettingsToggle
            label="☀️ Morning Briefing"
            enabled={notifDraft.morningBriefing.enabled}
            onToggle={() =>
              setNotifDraft((c) => ({
                ...c,
                morningBriefing: {
                  ...c.morningBriefing,
                  enabled: !c.morningBriefing.enabled,
                },
              }))
            }
          />
          <TimePickerField
            label="Morning briefing time"
            value={notifDraft.morningBriefing.time}
            onChange={(time) =>
              setNotifDraft((c) => ({
                ...c,
                morningBriefing: { ...c.morningBriefing, time },
              }))
            }
          />
          <View style={styles.inlineBtn}>
            <Button label="Update Notifications" onPress={saveNotifications} />
          </View>
        </SettingsSection>

        <SettingsSection title="AI Companion">
          <View style={styles.aiStatusRow}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusWrap}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: aiConfig?.isConnected ? uiTheme.success : uiTheme.danger },
                ]}
              />
              <Text style={styles.value}>
                {aiConfig?.isConnected ? "Connected" : "Not connected"}
              </Text>
            </View>
          </View>
          <SettingsRow
            label="Provider"
            value={aiConfig ? PROVIDERS[aiConfig.provider].displayName : "None"}
            onPress={() => openSheet("provider")}
          />
          <SettingsRow
            label="Model"
            value={modelDisplayName}
            onPress={() => openSheet("model")}
          />
          <SettingsRow
            label="API Key"
            value={aiConfig?.apiKey ? "••••••••" : "Not set"}
            onPress={() => openSheet("apiKey")}
          />
          <SettingsRow
            label="Base URL"
            value={aiConfig?.baseURL || "auto"}
            onPress={() => openSheet("baseUrl")}
          />
          <View style={styles.inlineBtn}>
            <Button
              label="Test Connection"
              variant="secondary"
              onPress={runAiTest}
              loading={aiTesting}
            />
            {aiTestStatus ? <Text style={styles.aiStatus}>{aiTestStatus}</Text> : null}
          </View>
        </SettingsSection>

        <SettingsSection title="Units">
          <View style={styles.unitRow}>
            <Text style={styles.label}>Weight</Text>
            <SegmentedControl
              options={["kg", "lbs"]}
              selected={appPreferences.weightUnit}
              onChange={(unit) => {
                updateAppPreferences({ weightUnit: unit as "kg" | "lbs" });
                showToast("Weight unit saved");
              }}
            />
          </View>
          <View style={[styles.unitRow, { marginBottom: 8 }]}>
            <Text style={styles.label}>Height</Text>
            <SegmentedControl
              options={["cm", "ft"]}
              selected={appPreferences.heightUnit}
              onChange={(unit) => {
                updateAppPreferences({ heightUnit: unit as "cm" | "ft" });
                showToast("Height unit saved");
              }}
            />
          </View>
        </SettingsSection>

        <SettingsSection title="Data">
          <Pressable style={styles.actionRow} onPress={exportData}>
            <Text style={styles.actionText}>Export all my data</Text>
          </Pressable>
          <Pressable style={styles.actionRow} onPress={confirmResetToday}>
            <Text style={styles.actionText}>Reset today's data</Text>
          </Pressable>
          <Pressable style={[styles.actionRow, styles.actionDanger]} onPress={confirmClearAll}>
            <Text style={styles.actionDangerText}>Clear all data / Start fresh</Text>
          </Pressable>
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow
            label="App version"
            value={Constants.expoConfig?.version ?? "1.0.0"}
          />
          <SettingsRow label="Built with" value="Expo + Claude API" isLast />
          <Pressable
            style={styles.actionRow}
            onPress={() =>
              Linking.openURL("mailto:support@dayos.app?subject=DayOS%20Feedback")
            }
          >
            <Text style={styles.actionText}>Send feedback</Text>
          </Pressable>
        </SettingsSection>
      </ScrollView>

      <BottomSheet
        visible={sheet !== null}
        onClose={closeSheet}
        title={sheetTitle}
        height={sheetHeight}
      >
        {sheet === "profile" ? (
          <View style={styles.sheetForm}>
            <Input label="Name" value={editName} onChangeText={setEditName} placeholder="Name" />
            <Input label="Age" value={editAge} onChangeText={setEditAge} placeholder="28" keyboardType="number-pad" />
            <Button
              label="Save"
              onPress={() => {
                updateProfile({ name: editName.trim(), age: Number(editAge) });
                showToast("Profile updated");
                closeSheet();
              }}
            />
          </View>
        ) : null}

        {sheet === "height" ? (
          <View style={styles.sheetForm}>
            <Input
              label={`Height (${appPreferences.heightUnit})`}
              value={editHeight}
              onChangeText={setEditHeight}
              placeholder={appPreferences.heightUnit === "cm" ? "175" : "5'9\""}
            />
            <Button
              label="Save"
              onPress={() => {
                const cm = parseHeightInputCm(editHeight, appPreferences.heightUnit);
                if (cm) {
                  updateProfile({ heightCm: cm });
                  recalculateTDEE();
                  showToast("Height saved");
                  closeSheet();
                }
              }}
            />
          </View>
        ) : null}

        {sheet === "weight" ? (
          <View style={styles.sheetForm}>
            <Input label="Current weight" value={editWeight} onChangeText={setEditWeight} placeholder="78" keyboardType="decimal-pad" />
            <Button
              label="Save"
              onPress={() => {
                const kg = parseWeightInput(editWeight, appPreferences.weightUnit);
                if (kg) {
                  updateProfile({ weightKg: kg });
                  logWeight(kg);
                  recalculateTDEE();
                  showToast("Weight logged");
                  closeSheet();
                }
              }}
            />
          </View>
        ) : null}

        {sheet === "goalWeight" ? (
          <View style={styles.sheetForm}>
            <Input label="Goal weight" value={editGoalWeight} onChangeText={setEditGoalWeight} placeholder="70" keyboardType="decimal-pad" />
            <Button
              label="Save"
              onPress={() => {
                const kg = parseWeightInput(editGoalWeight, appPreferences.weightUnit);
                if (kg) {
                  updateProfile({ goalWeightKg: kg });
                  showToast("Goal weight saved");
                  closeSheet();
                }
              }}
            />
          </View>
        ) : null}

        {sheet === "goalType" && profile ? (
          <SegmentedControl
            options={Object.values(GOAL_LABELS)}
            selected={GOAL_LABELS[profile.goalType]}
            onChange={(label) => {
              const type = (Object.keys(GOAL_LABELS) as GoalType[]).find(
                (k) => GOAL_LABELS[k] === label
              );
              if (type) {
                updateProfile({ goalType: type });
                recalculateTDEE();
                showToast("Goal type saved");
                closeSheet();
              }
            }}
          />
        ) : null}

        {sheet === "activity" && profile ? (
          <SegmentedControl
            options={Object.values(ACTIVITY_LABELS)}
            selected={ACTIVITY_LABELS[profile.activityLevel]}
            onChange={(label) => {
              const level = (Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).find(
                (k) => ACTIVITY_LABELS[k] === label
              );
              if (level) {
                updateProfile({ activityLevel: level });
                recalculateTDEE();
                showToast("Activity level saved");
                closeSheet();
              }
            }}
          />
        ) : null}

        {sheet === "calorieOverride" ? (
          <View style={styles.sheetForm}>
            <Input
              label="Manual daily calories"
              value={editNumber || String(appPreferences.manualCalorieGoal)}
              onChangeText={setEditNumber}
              placeholder="1350"
              keyboardType="number-pad"
            />
            <Button
              label="Save"
              onPress={() => {
                const val = Number(editNumber || appPreferences.manualCalorieGoal);
                if (!Number.isNaN(val) && val > 0) {
                  updateAppPreferences({
                    manualCalorieOverride: true,
                    manualCalorieGoal: val,
                  });
                  updateProfile({ dailyCalorieGoal: val });
                  showToast("Calorie goal saved");
                  closeSheet();
                }
              }}
            />
          </View>
        ) : null}

        {sheet === "bottleSize" ? (
          <View style={styles.sheetForm}>
            <Input label="Bottle size (ml)" value={editNumber} onChangeText={setEditNumber} placeholder="750" keyboardType="number-pad" />
            <Button
              label="Save"
              onPress={() => {
                const val = Number(editNumber);
                if (!Number.isNaN(val) && val > 0) {
                  updateWaterConfig({ ...waterConfig, bottleSizeMl: val });
                  showToast("Bottle size saved");
                  closeSheet();
                }
              }}
            />
          </View>
        ) : null}

        {sheet === "waterGoal" ? (
          <View style={styles.sheetForm}>
            <Input label="Daily bottles" value={editNumber} onChangeText={setEditNumber} placeholder="3" keyboardType="number-pad" />
            <Button
              label="Save"
              onPress={() => {
                const val = Number(editNumber);
                if (!Number.isNaN(val) && val > 0) {
                  updateWaterConfig({ ...waterConfig, dailyGoalBottles: Math.round(val) });
                  showToast("Water goal saved");
                  closeSheet();
                }
              }}
            />
          </View>
        ) : null}

        {["focusWork", "focusBreak", "focusSessions", "focusLongBreak"].includes(
          sheet ?? ""
        ) ? (
          <View style={styles.sheetForm}>
            <Input label="Minutes" value={editNumber} onChangeText={setEditNumber} placeholder="25" keyboardType="number-pad" />
            <Button
              label="Save"
              onPress={() => {
                const val = Number(editNumber);
                if (Number.isNaN(val) || val <= 0) return;
                if (sheet === "focusWork") updateFocusConfig({ workMinutes: val });
                if (sheet === "focusBreak") updateFocusConfig({ breakMinutes: val });
                if (sheet === "focusSessions")
                  updateFocusConfig({ sessionsBeforeLongBreak: Math.round(val) });
                if (sheet === "focusLongBreak") updateFocusConfig({ longBreakMinutes: val });
                showToast("Focus settings saved");
                closeSheet();
              }}
            />
          </View>
        ) : null}

        {sheet === "stepGoal" ? (
          <View style={styles.sheetForm}>
            <Input label="Daily step goal" value={editNumber} onChangeText={setEditNumber} placeholder="8000" keyboardType="number-pad" />
            <Button
              label="Save"
              onPress={() => {
                const val = Number(editNumber);
                if (!Number.isNaN(val) && val > 0) {
                  updateAppPreferences({ stepGoal: Math.round(val) });
                  updateStepGoal(Math.round(val));
                  showToast("Step goal saved");
                  closeSheet();
                }
              }}
            />
          </View>
        ) : null}

        {sheet === "provider" ? (
          <View style={styles.sheetForm}>
            {PROVIDER_ORDER.map((id) => (
              <Button
                key={id}
                label={PROVIDERS[id].displayName}
                variant={aiConfig?.provider === id ? "primary" : "secondary"}
                onPress={() => {
                  const provider = PROVIDERS[id];
                  const model =
                    provider.models.find((m) => m.isFree)?.id ?? provider.models[0]?.id ?? "";
                  setAIConfig({
                    provider: id,
                    apiKey: aiConfig?.apiKey ?? "",
                    model,
                    baseURL: provider.baseURL,
                    isConnected: false,
                  });
                  showToast("Provider updated");
                  closeSheet();
                }}
              />
            ))}
          </View>
        ) : null}

        {sheet === "model" && aiConfig ? (
          <ModelPicker
            providerId={aiConfig.provider}
            selectedModelId={aiConfig.model}
            onSelect={(modelId) => {
              setAIConfig({ ...aiConfig, model: modelId, isConnected: false });
              showToast("Model updated");
              closeSheet();
            }}
          />
        ) : null}

        {sheet === "apiKey" ? (
          <View style={styles.sheetForm}>
            <Input
              label="API Key"
              value={editApiKey}
              onChangeText={setEditApiKey}
              placeholder="sk-..."
              secureTextEntry={!showApiKey}
            />
            <Pressable onPress={() => setShowApiKey((v) => !v)}>
              <Text style={styles.link}>{showApiKey ? "Hide" : "Show"} key</Text>
            </Pressable>
            <Button
              label="Save"
              onPress={() => {
                if (aiConfig) {
                  setAIConfig({ ...aiConfig, apiKey: editApiKey, isConnected: false });
                  showToast("API key saved");
                  closeSheet();
                }
              }}
            />
          </View>
        ) : null}

        {sheet === "baseUrl" ? (
          <View style={styles.sheetForm}>
            <Input
              label="Base URL"
              value={editBaseUrl}
              onChangeText={setEditBaseUrl}
              placeholder="auto"
            />
            <Button
              label="Save"
              onPress={() => {
                if (aiConfig) {
                  setAIConfig({
                    ...aiConfig,
                    baseURL: editBaseUrl.trim(),
                    isConnected: false,
                  });
                  showToast("Base URL saved");
                  closeSheet();
                }
              }}
            />
          </View>
        ) : null}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: uiTheme.background },
  content: { padding: 20, paddingBottom: 40 },
  empty: { flex: 1, justifyContent: "center", padding: 24, gap: 16 },
  emptyText: { color: uiTheme.textSecondary, textAlign: "center" },
  profileHeader: { alignItems: "center", gap: 10, marginBottom: 24 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: uiTheme.surface2,
    borderWidth: 2,
    borderColor: uiTheme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: uiTheme.accent, fontSize: 28, fontWeight: "800" },
  profileName: { color: uiTheme.textPrimary, fontSize: 24, fontWeight: "800" },
  inlineBtn: { padding: 12 },
  timeList: { paddingHorizontal: 12, gap: 8, paddingBottom: 8 },
  aiStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.border,
  },
  statusWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  label: { color: uiTheme.textPrimary, fontSize: 15 },
  value: { color: uiTheme.accent, fontWeight: "600", fontSize: 14 },
  aiStatus: { color: uiTheme.textSecondary, marginTop: 8, fontSize: 13 },
  unitRow: { paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  actionRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: uiTheme.border,
  },
  actionText: { color: uiTheme.accent, fontWeight: "600", fontSize: 15 },
  actionDanger: { borderBottomWidth: 0 },
  actionDangerText: { color: uiTheme.danger, fontWeight: "700", fontSize: 15 },
  sheetForm: { gap: 12 },
  link: { color: uiTheme.accent, fontWeight: "600", marginBottom: 8 },
});
