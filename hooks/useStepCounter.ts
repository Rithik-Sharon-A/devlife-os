import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

const GOAL_KEY = "dayos:step_goal";
const MANUAL_KEY = "dayos:steps:manual:";
const SNAPSHOT_KEY = "dayos:steps:snapshot:";
const DEFAULT_GOAL = 8000;
const POLL_MS = 30_000;

const getTodayString = () => new Date().toISOString().split("T")[0]!;

async function loadPedometer() {
  return import("expo-pedometer");
}

export function useStepCounter() {
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isManual, setIsManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepsRef = useRef(0);
  const isManualRef = useRef(false);
  const currentDayRef = useRef(getTodayString());

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    isManualRef.current = isManual;
  }, [isManual]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const saveSnapshot = async (date: string, count: number) => {
    try {
      await AsyncStorage.setItem(SNAPSHOT_KEY + date, count.toString());
    } catch {
      // ignore
    }
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

  const checkManualOverride = async () => {
    try {
      const today = getTodayString();
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

  const refreshTodaySteps = useCallback(async () => {
    try {
      const { getTodayStepCountAsync } = await loadPedometer();
      const fresh = await getTodayStepCountAsync();
      setSteps(fresh);
      stepsRef.current = fresh;
      await saveSnapshot(getTodayString(), fresh);
      return fresh;
    } catch {
      return stepsRef.current;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(() => {
      if (!isManualRef.current) {
        void refreshTodaySteps();
      }
    }, POLL_MS);
  }, [refreshTodaySteps, stopPolling]);

  const startNativePedometer = useCallback(async () => {
    if (Platform.OS === "web") {
      setError("Not available on web");
      setIsLoading(false);
      return;
    }

    try {
      const { isAvailableAsync, requestPermissionsAsync, getTodayStepCountAsync, PermissionStatus } =
        await loadPedometer();

      const available = await isAvailableAsync();
      setIsAvailable(available);

      if (!available) {
        setError("Step counter not available on this device");
        setIsLoading(false);
        return;
      }

      const permission = await requestPermissionsAsync();

      if (permission.status !== PermissionStatus.GRANTED) {
        setError("Step counter permission denied");
        setIsLoading(false);
        return;
      }

      stopPolling();

      const todaySteps = await getTodayStepCountAsync();
      setSteps(todaySteps);
      stepsRef.current = todaySteps;
      await saveSnapshot(getTodayString(), todaySteps);

      startPolling();
      setError(null);
      setIsLoading(false);
    } catch (e) {
      console.log("[Steps] Native pedometer error:", e);
      setError("Could not access step counter");
      setIsAvailable(false);
      setIsLoading(false);
    }
  }, [startPolling, stopPolling]);

  useEffect(() => {
    const init = async () => {
      await loadGoal();

      const hasManual = await checkManualOverride();

      if (!hasManual) {
        await startNativePedometer();
      } else {
        try {
          const { isAvailableAsync } = await loadPedometer();
          const available = await isAvailableAsync();
          setIsAvailable(available);
        } catch {
          setIsAvailable(false);
        }
        setIsLoading(false);
      }
    };

    void init();

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;

      const today = getTodayString();
      if (today !== currentDayRef.current) {
        currentDayRef.current = today;
        setIsManual(false);
        isManualRef.current = false;
        void startNativePedometer();
        return;
      }

      if (!isManualRef.current) {
        void refreshTodaySteps();
      }
    });

    return () => {
      appStateSub.remove();
      stopPolling();
    };
  }, [refreshTodaySteps, startNativePedometer, stopPolling]);

  const setManualSteps = async (count: number) => {
    const safe = Math.max(0, Math.floor(count));
    const today = getTodayString();
    stopPolling();
    setSteps(safe);
    stepsRef.current = safe;
    setIsManual(true);
    isManualRef.current = true;
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
    setIsLoading(true);
    await startNativePedometer();
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

    let canReadToday = false;
    try {
      const { isAvailableAsync } = await loadPedometer();
      canReadToday = await isAvailableAsync();
    } catch {
      // ignore
    }

    for (let i = 0; i < daysBack; i++) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const dateStr = start.toISOString().split("T")[0]!;

      if (i === 0) {
        try {
          const manual = await AsyncStorage.getItem(MANUAL_KEY + today);
          if (manual !== null) {
            results.push({ date: dateStr, steps: parseInt(manual, 10) || 0 });
            continue;
          }
        } catch {
          // fall through
        }

        if (canReadToday) {
          try {
            const { getTodayStepCountAsync } = await loadPedometer();
            const daySteps = await getTodayStepCountAsync();
            results.push({ date: dateStr, steps: daySteps });
            await saveSnapshot(dateStr, daySteps);
            continue;
          } catch {
            // fall through
          }
        }
      }

      try {
        const snap = await AsyncStorage.getItem(SNAPSHOT_KEY + dateStr);
        if (snap !== null) {
          results.push({ date: dateStr, steps: parseInt(snap, 10) || 0 });
        } else {
          results.push({ date: dateStr, steps: 0 });
        }
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
    error,
    setManualSteps,
    clearManualOverride,
    updateGoal,
    getHistoricalSteps,
  };
}

export default useStepCounter;
