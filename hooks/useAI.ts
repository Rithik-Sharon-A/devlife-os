import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useMemo } from "react";

import {
  chatPrompt,
  daySummaryPrompt,
  focusCoachPrompt,
  foodEstimatePrompt,
  mealSuggestionPrompt,
  morningNudgePrompt,
  waterNudgePrompt,
  weeklyInsightPrompt,
} from "../data/aiPrompts";
import { buildRequest, getProvider, parseResponse } from "../data/providers";
import { useAppStore } from "../store/useAppStore";
import type {
  AIMessage,
  DailyContext,
  DailyFoodLog,
  FoodItem,
  MealType,
  Task,
  UserProfile,
} from "../types";
import { getLast7Days, getNowString, getTodayString } from "../utils/date";
import * as storage from "../utils/storage";
import { calculateDayScore } from "../utils/tdee";

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_TOKENS = 500;
const MORNING_NUDGE_TTL_MS = 60 * 60 * 1000;
const MORNING_NUDGE_CACHE_KEY = "dayos:ai:morning-nudge";

interface MorningNudgeCache {
  text: string;
  cachedAt: number;
  date: string;
}

interface FoodEstimateJson {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: "high" | "medium" | "low";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyFoodLog(date: string): DailyFoodLog {
  return {
    date,
    entries: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  };
}

function toReadableError(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "Request timed out. Check your internet connection and try again.";
    }
    return error.message;
  }
  return "Something went wrong while contacting the AI provider.";
}

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function applyMaxTokens(
  providerId: string,
  bodyObj: Record<string, unknown>
): void {
  if ("max_tokens" in bodyObj) {
    bodyObj.max_tokens = MAX_TOKENS;
  }
  if (providerId === "anthropic") {
    bodyObj.max_tokens = MAX_TOKENS;
  }
  if (providerId === "gemini") {
    const generationConfig = bodyObj.generationConfig as
      | Record<string, unknown>
      | undefined;
    if (generationConfig) {
      generationConfig.maxOutputTokens = MAX_TOKENS;
    }
  }
  if (providerId === "ollama") {
    const options = bodyObj.options as Record<string, unknown> | undefined;
    if (options) {
      options.num_predict = MAX_TOKENS;
    }
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(
  url: string,
  init: RequestInit
): Promise<Response> {
  try {
    return await fetchWithTimeout(url, init);
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("timeout"));

    if (!isTimeout) throw error;

    return fetchWithTimeout(url, init);
  }
}

async function getCachedMorningNudge(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(MORNING_NUDGE_CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw) as MorningNudgeCache;
    const isFresh = Date.now() - cached.cachedAt < MORNING_NUDGE_TTL_MS;
    const isToday = cached.date === getTodayString();

    if (isFresh && isToday) return cached.text;
    return null;
  } catch {
    return null;
  }
}

function setCachedMorningNudge(text: string): void {
  const payload: MorningNudgeCache = {
    text,
    cachedAt: Date.now(),
    date: getTodayString(),
  };
  void AsyncStorage.setItem(MORNING_NUDGE_CACHE_KEY, JSON.stringify(payload));
}

function parseNumberedInsights(text: string): string[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const numbered = lines
    .filter((line) => /^\d+[\.)]\s+/.test(line))
    .map((line) => line.replace(/^\d+[\.)]\s+/, "").trim());

  if (numbered.length >= 3) return numbered.slice(0, 3);
  if (lines.length >= 3) return lines.slice(0, 3);
  return [text.trim()];
}

async function buildWeeklyContexts(
  profile: UserProfile,
  todayContext: DailyContext
): Promise<DailyContext[]> {
  const contexts: DailyContext[] = [];

  for (const date of getLast7Days()) {
    if (date === getTodayString()) {
      contexts.push(todayContext);
      continue;
    }

    const food = (await storage.getFoodLog(date)) ?? emptyFoodLog(date);
    const sleep = (await storage.getSleepLog(date)) ?? undefined;
    const mood = (await storage.getMoodLog(date)) ?? undefined;

    const context: DailyContext = {
      profile,
      date,
      timeOfDay: "morning",
      food,
      water: {
        bottlesConsumed: 0,
        goalBottles: todayContext.water.goalBottles,
        mlConsumed: 0,
      },
      tasks: { total: 0, completed: 0, mitCompleted: false },
      habits: { total: 0, completed: 0, list: [] },
      focus: { sessionsCompleted: 0, totalMinutes: 0 },
      sleep,
      mood,
      dayScore: {
        tasksPercent: 0,
        caloriesPercent: 0,
        waterPercent: 0,
        habitsPercent: 0,
        overall: 0,
      },
    };

    context.dayScore = calculateDayScore(context);
    contexts.push(context);
  }

  return contexts;
}

function parseFoodEstimate(
  description: string,
  portion: string,
  raw: string
): FoodItem {
  const parsed = JSON.parse(stripJsonFences(raw)) as FoodEstimateJson;

  if (
    typeof parsed.calories !== "number" ||
    typeof parsed.protein !== "number" ||
    typeof parsed.carbs !== "number" ||
    typeof parsed.fat !== "number"
  ) {
    throw new Error("AI returned an invalid food estimate format.");
  }

  const tags = ["ai_estimate"];
  if (parsed.confidence) tags.push(`confidence_${parsed.confidence}`);

  return {
    id: generateId(),
    name: description,
    calories: Math.round(parsed.calories),
    protein: Math.round(parsed.protein * 10) / 10,
    carbs: Math.round(parsed.carbs * 10) / 10,
    fat: Math.round(parsed.fat * 10) / 10,
    servingSize: 1,
    servingUnit: portion,
    category: "custom",
    tags,
    source: "ai_estimate",
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAI() {
  const aiConfig = useAppStore((state) => state.aiConfig);
  const isLoading = useAppStore((state) => state.isLoadingAI);
  const error = useAppStore((state) => state.aiError);
  const setAILoading = useAppStore((state) => state.setAILoading);
  const setAIError = useAppStore((state) => state.setAIError);
  const getDailyContext = useAppStore((state) => state.getDailyContext);
  const getRemainingCalories = useAppStore((state) => state.getRemainingCalories);
  const tasks = useAppStore((state) => state.tasks);

  const isConfigured = useMemo(() => {
    if (!aiConfig?.model) return false;

    const provider = getProvider(aiConfig.provider);
    if (provider.requiresKey && !aiConfig.apiKey.trim()) return false;

    return true;
  }, [aiConfig]);

  const requireContext = useCallback((): DailyContext => {
    try {
      return getDailyContext();
    } catch {
      throw new Error("Complete your profile before using AI features.");
    }
  }, [getDailyContext]);

  const executeRequest = useCallback(
    async (
      systemPrompt: string,
      messages: AIMessage[]
    ): Promise<string> => {
      if (!aiConfig) {
        throw new Error("AI is not configured. Add a provider in Settings.");
      }

      const provider = getProvider(aiConfig.provider);

      if (provider.requiresKey && !aiConfig.apiKey.trim()) {
        throw new Error(`${provider.displayName} requires an API key.`);
      }

      const model = aiConfig.model || provider.models[0]?.id;
      if (!model) {
        throw new Error(`No model selected for ${provider.displayName}.`);
      }

      const built = buildRequest(
        provider,
        aiConfig.apiKey,
        messages,
        model,
        systemPrompt
      );

      const bodyObj = JSON.parse(built.body) as Record<string, unknown>;
      applyMaxTokens(provider.id, bodyObj);

      setAILoading(true);
      setAIError(null);

      try {
        const response = await fetchWithRetry(built.url, {
          method: "POST",
          headers: built.headers,
          body: JSON.stringify(bodyObj),
        });

        const rawText = await response.text();
        let payload: unknown;

        try {
          payload = JSON.parse(rawText);
        } catch {
          throw new Error(
            response.ok
              ? "AI provider returned a non-JSON response."
              : rawText || `Request failed with status ${response.status}.`
          );
        }

        if (!response.ok) {
          const apiError =
            (payload as { error?: { message?: string }; message?: string })
              ?.error?.message ??
            (payload as { message?: string })?.message ??
            `Request failed with status ${response.status}.`;
          throw new Error(apiError);
        }

        return parseResponse(provider, payload).trim();
      } finally {
        setAILoading(false);
      }
    },
    [aiConfig, setAIError, setAILoading]
  );

  const askAI = useCallback(
    async (systemPrompt: string, userMessage: string): Promise<string> => {
      try {
        const messages: AIMessage[] = [
          { role: "user", content: userMessage, timestamp: getNowString() },
        ];
        return await executeRequest(systemPrompt, messages);
      } catch (err) {
        const message = toReadableError(err);
        setAIError(message);
        throw new Error(message);
      }
    },
    [executeRequest, setAIError]
  );

  const askPrompt = useCallback(
    async (systemPrompt: string, userMessage: string): Promise<string> => {
      return askAI(systemPrompt, userMessage);
    },
    [askAI]
  );

  const getMorningNudge = useCallback(async (): Promise<string> => {
    const cached = await getCachedMorningNudge();
    if (cached) return cached;

    try {
      const context = requireContext();
      const { systemPrompt, userMessage } = morningNudgePrompt(context);
      const response = await askPrompt(systemPrompt, userMessage);
      setCachedMorningNudge(response);
      return response;
    } catch (err) {
      return toReadableError(err);
    }
  }, [askPrompt, requireContext]);

  const getMealSuggestion = useCallback(
    async (mealType: MealType): Promise<string> => {
      try {
        const context = requireContext();
        const remaining = getRemainingCalories();
        const { systemPrompt, userMessage } = mealSuggestionPrompt(
          context,
          remaining,
          mealType
        );
        return await askPrompt(systemPrompt, userMessage);
      } catch (err) {
        return toReadableError(err);
      }
    },
    [askPrompt, getRemainingCalories, requireContext]
  );

  const getFocusCoach = useCallback(
    async (task?: Task): Promise<string> => {
      try {
        const context = requireContext();
        const selectedTask =
          task ??
          tasks.find((t) => !t.isCompleted) ??
          ({
            id: "focus-general",
            title: "Deep focus session",
            isMIT: false,
            isCompleted: false,
            createdAt: getNowString(),
          } satisfies Task);

        const { systemPrompt, userMessage } = focusCoachPrompt(
          context,
          selectedTask
        );
        return await askPrompt(systemPrompt, userMessage);
      } catch (err) {
        return toReadableError(err);
      }
    },
    [askPrompt, requireContext, tasks]
  );

  const getWaterNudge = useCallback(async (): Promise<string> => {
    try {
      const context = requireContext();
      const { systemPrompt, userMessage } = waterNudgePrompt(context);
      return await askPrompt(systemPrompt, userMessage);
    } catch (err) {
      return toReadableError(err);
    }
  }, [askPrompt, requireContext]);

  const getDaySummary = useCallback(async (): Promise<string> => {
    try {
      const context = requireContext();
      const { systemPrompt, userMessage } = daySummaryPrompt(context);
      return await askPrompt(systemPrompt, userMessage);
    } catch (err) {
      return toReadableError(err);
    }
  }, [askPrompt, requireContext]);

  const estimateFoodCalories = useCallback(
    async (description: string, portion: string): Promise<FoodItem> => {
      try {
        const { systemPrompt, userMessage } = foodEstimatePrompt(
          description,
          portion
        );
        const raw = await askPrompt(systemPrompt, userMessage);
        return parseFoodEstimate(description, portion, raw);
      } catch (err) {
        throw new Error(toReadableError(err));
      }
    },
    [askPrompt]
  );

  const getWeeklyInsights = useCallback(async (): Promise<string[]> => {
    try {
      const todayContext = requireContext();
      const weekData = await buildWeeklyContexts(
        todayContext.profile,
        todayContext
      );
      const { systemPrompt, userMessage } = weeklyInsightPrompt(weekData);
      const response = await askPrompt(systemPrompt, userMessage);
      return parseNumberedInsights(response);
    } catch (err) {
      return [toReadableError(err)];
    }
  }, [askPrompt, requireContext]);

  const sendChatMessage = useCallback(
    async (message: string, history: AIMessage[]): Promise<string> => {
      try {
        const context = requireContext();
        const { systemPrompt } = chatPrompt(context, message);
        const messages: AIMessage[] = [
          ...history.filter((m) => m.role !== "system"),
          { role: "user", content: message, timestamp: getNowString() },
        ];
        return await executeRequest(systemPrompt, messages);
      } catch (err) {
        const readable = toReadableError(err);
        setAIError(readable);
        return readable;
      }
    },
    [executeRequest, requireContext, setAIError]
  );

  const testConnection = useCallback(async (): Promise<{
    success: boolean;
    model: string;
    latencyMs: number;
  }> => {
    const model = aiConfig?.model ?? "unknown";
    const started = Date.now();

    try {
      const reply = await askAI(
        "You are a connection test assistant.",
        "Reply with exactly: OK"
      );

      return {
        success: reply.toUpperCase().includes("OK"),
        model,
        latencyMs: Date.now() - started,
      };
    } catch (err) {
      setAIError(toReadableError(err));
      return {
        success: false,
        model,
        latencyMs: Date.now() - started,
      };
    }
  }, [aiConfig?.model, askAI, setAIError]);

  return {
    askAI,
    getMorningNudge,
    getMealSuggestion,
    getFocusCoach,
    getWaterNudge,
    getDaySummary,
    estimateFoodCalories,
    getWeeklyInsights,
    sendChatMessage,
    testConnection,
    isConfigured,
    isLoading,
    error,
  };
}
