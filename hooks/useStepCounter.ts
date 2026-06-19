import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EventSubscription } from "expo-modules-core";
import { Pedometer } from "expo-sensors";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import { APP_NAME } from "../utils/appBrand";

const GOAL_KEY = "dayos:step_goal";
const MANUAL_KEY = "dayos:steps:manual:";
const SNAPSHOT_KEY = "dayos:steps:snapshot:";
const DEFAULT_GOAL = 8000;

const PERMISSION_DENIED_MSG = `Step counter needs permission. Go to Settings → Apps → ${APP_NAME} → Permissions → Physical Activity → Allow`;

const getTodayString = () => new Date().toISOString().split("T")[0]!;

export function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isManual, setIsManual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const subscriptionRef = useRef<EventSubscription | null>(null);
  const watchBaseRef = useRef(0);
  const stepsRef = useRef(0);
  const isManualRef = useRef(false);
  const currentDayRef = useRef(getTodayString());

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    isManualRef.current = isManual;
  }, [isManual]);

  const saveSnapshot = async (date: string, count: number) => {
    try {
      await AsyncStorage.setItem(SNAPSHOT_KEY + date, count.toString());
    } catch {
      // ignore
    }
  };

  const loadSnapshot = async (date: string): Promise<number> => {
    try {
      const saved = await AsyncStorage.getItem(SNAPSHOT_KEY + date);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return 0;
  };

  const loadGoal = async () => {
    try {
      const saved = await AsyncStorage.getItem(GOAL_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed) && parsed > 0) setGoal(parsed);
      }
    } catch {
      // ignore
    }
  };

  const checkManualOverride = async (): Promise<boolean> => {
    const today = getTodayString();
    try {
      const manual = await AsyncStorage.getItem(MANUAL_KEY + today);
      if (manual !== null) {
        const count = parseInt(manual, 10);
        if (!Number.isNaN(count)) {
          setSteps(count);
          stepsRef.current = count;
        }
        setIsManual(true);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  };

  const stopWatch = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  const startWatch = useCallback(() => {
    stopWatch();
    watchBaseRef.current = stepsRef.current;

    subscriptionRef.current = Pedometer.watchStepCount(({ steps: liveSteps }) => {
      const total = watchBaseRef.current + liveSteps;
      console.log("[Steps] Live update:", liveSteps, "total:", total);
      setSteps(total);
      stepsRef.current = total;
      void saveSnapshot(getTodayString(), total);
    });
  }, [stopWatch]);

  const loadTodayStepsFromSensor = useCallback(async () => {
    if (Platform.OS === "ios") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      const result = await Pedometer.getStepCountAsync(start, end);
      console.log("[Steps] Today from sensor (iOS):", result.steps);
      setSteps(result.steps);
      stepsRef.current = result.steps;
      await saveSnapshot(getTodayString(), result.steps);
      return;
    }

    const saved = await loadSnapshot(getTodayString());
    console.log("[Steps] Today from snapshot (Android):", saved);
    setSteps(saved);
    stepsRef.current = saved;
  }, []);

  const requestAndStart = useCallback(async () => {
    if (Platform.OS === "web") {
      setError("Not available on web");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const available = await Pedometer.isAvailableAsync();
      console.log("[Steps] Hardware available:", available);
      setIsAvailable(available);

      if (!available) {
        setError("Step counter hardware not found");
        setIsLoading(false);
        return;
      }

      const permission = await Pedometer.requestPermissionsAsync();
      console.log("[Steps] Permission granted:", permission.granted);
      setHasPermission(permission.granted);

      if (!permission.granted) {
        setError(PERMISSION_DENIED_MSG);
        setIsLoading(false);
        return;
      }

      try {
        await loadTodayStepsFromSensor();
      } catch (e) {
        console.log("[Steps] Initial step read error:", e);
        setSteps(0);
        stepsRef.current = 0;
      }

      startWatch();

      setError(null);
      setIsLoading(false);
      console.log("[Steps] Step counter started ✅");
    } catch (e) {
      console.log("[Steps] Fatal error:", e);
      setError("Could not start step counter");
      setIsAvailable(false);
      setIsLoading(false);
    }
  }, [loadTodayStepsFromSensor, startWatch]);

  const refreshOnForeground = useCallback(async () => {
    if (isManualRef.current || Platform.OS === "web") return;

    try {
      const permission = await Pedometer.getPermissionsAsync();
      if (!permission.granted) return;

      if (Platform.OS === "ios") {
        await loadTodayStepsFromSensor();
      } else {
        const saved = await loadSnapshot(getTodayString());
        if (saved > stepsRef.current) {
          setSteps(saved);
          stepsRef.current = saved;
        }
      }

      startWatch();
    } catch (e) {
      console.log("[Steps] Foreground refresh error:", e);
    }
  }, [loadTodayStepsFromSensor, startWatch]);

  useEffect(() => {
    const init = async () => {
      await loadGoal();

      const hasManual = await checkManualOverride();
      if (hasManual) {
        try {
          setIsAvailable(await Pedometer.isAvailableAsync());
        } catch {
          setIsAvailable(false);
        }
        setIsLoading(false);
        return;
      }

      await requestAndStart();
    };

    void init();

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        if (!isManualRef.current) {
          void saveSnapshot(getTodayString(), stepsRef.current);
        }
        return;
      }

      if (state !== "active") return;

      const today = getTodayString();
      if (today !== currentDayRef.current) {
        currentDayRef.current = today;
        setIsManual(false);
        isManualRef.current = false;
        void requestAndStart();
        return;
      }

      void refreshOnForeground();
    });

    return () => {
      appStateSub.remove();
      stopWatch();
    };
  }, [refreshOnForeground, requestAndStart, stopWatch]);

  const retryStepCounter = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await requestAndStart();
  }, [requestAndStart]);

  const setManualSteps = async (count: number) => {
    const safe = Math.max(0, Math.floor(count));
    const today = getTodayString();
    stopWatch();
    setSteps(safe);
    stepsRef.current = safe;
    setIsManual(true);
    isManualRef.current = true;
    setError(null);
    try {
      await AsyncStorage.setItem(MANUAL_KEY + today, safe.toString());
      await saveSnapshot(today, safe);
    } catch {
      // ignore
    }
  };

  const clearManualOverride = async () => {
    const today = getTodayString();
    setIsManual(false);
    isManualRef.current = false;
    try {
      await AsyncStorage.removeItem(MANUAL_KEY + today);
    } catch {
      // ignore
    }
    await requestAndStart();
  };

  const updateGoal = async (newGoal: number) => {
    setGoal(newGoal);
    try {
      await AsyncStorage.setItem(GOAL_KEY, newGoal.toString());
    } catch {
      // ignore
    }
  };

  const getHistoricalSteps = async (
    daysBack: number
  ): Promise<{ date: string; steps: number }[]> => {
    const results: { date: string; steps: number }[] = [];
    const today = getTodayString();

    for (let i = 0; i < daysBack; i++) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      const dateStr = start.toISOString().split("T")[0]!;

      if (dateStr === today) {
        try {
          const manual = await AsyncStorage.getItem(MANUAL_KEY + today);
          if (manual !== null) {
            results.push({ date: dateStr, steps: parseInt(manual, 10) || 0 });
            continue;
          }
        } catch {
          // fall through
        }

        if (Platform.OS === "ios") {
          try {
            const permission = await Pedometer.getPermissionsAsync();
            if (permission.granted) {
              const result = await Pedometer.getStepCountAsync(start, end);
              results.push({ date: dateStr, steps: result.steps });
              await saveSnapshot(dateStr, result.steps);
              continue;
            }
          } catch {
            // fall through
          }
        }

        results.push({ date: dateStr, steps: stepsRef.current });
        continue;
      }

      if (Platform.OS === "ios") {
        try {
          const permission = await Pedometer.getPermissionsAsync();
          if (permission.granted) {
            const result = await Pedometer.getStepCountAsync(start, end);
            results.push({ date: dateStr, steps: result.steps });
            await saveSnapshot(dateStr, result.steps);
            continue;
          }
        } catch {
          // fall through
        }
      }

      try {
        const snap = await AsyncStorage.getItem(SNAPSHOT_KEY + dateStr);
        results.push({
          date: dateStr,
          steps: snap !== null ? parseInt(snap, 10) || 0 : 0,
        });
      } catch {
        results.push({ date: dateStr, steps: 0 });
      }
    }

    return results;
  };

  const percentage = Math.min(100, goal > 0 ? Math.round((steps / goal) * 100) : 0);

  return {
    steps,
    goal,
    percentage,
    isAvailable,
    isLoading,
    isManual,
    hasPermission,
    error,
    retryStepCounter,
    setManualSteps,
    clearManualOverride,
    updateGoal,
    getHistoricalSteps,
  };
}

export default useStepCounter;
