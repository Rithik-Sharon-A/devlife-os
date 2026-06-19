/**
 * UPGRADE PATH TO NATIVE PEDOMETER:
 *
 * When building dev build or production APK:
 *
 * 1. npm install expo-pedometer
 *
 * 2. Replace the accelerometer subscription with:
 *    import { Pedometer } from 'expo-pedometer';
 *
 *    const { granted } = await Pedometer.requestPermissionsAsync();
 *
 *    const subscription = Pedometer.watchStepCount(result => {
 *      setSteps(result.steps);
 *    });
 *
 * 3. For historical steps:
 *    const end = new Date();
 *    const start = new Date();
 *    start.setHours(0, 0, 0, 0);
 *    const { steps } = await Pedometer.getStepCountAsync(start, end);
 *
 * Native pedometer is MORE ACCURATE because:
 * - Uses dedicated hardware step counter chip
 * - Counts even when app is in background
 * - Filters out non-walking movements
 * - Integrates with phone's health data
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import { StepDetector } from "../utils/stepDetector";

const STEPS_PREFIX = "dayos:steps:";
const GOAL_KEY = "dayos:step_goal";
const SENSITIVITY_KEY = "dayos:step_sensitivity";
const DEFAULT_GOAL = 8000;

export type StepSensitivity = "low" | "medium" | "high";

const THRESHOLDS: Record<StepSensitivity, number> = {
  low: 1.35,
  medium: 1.15,
  high: 0.95,
};

const getDateKey = (date: Date = new Date()) =>
  STEPS_PREFIX + date.toISOString().split("T")[0];

const getTodayString = () => new Date().toISOString().split("T")[0];

export interface StepCounterState {
  steps: number;
  goal: number;
  percentage: number;
  isAvailable: boolean;
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;
  todayDate: string;
  sensitivity: StepSensitivity;
}

export interface StepCounterActions {
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  resetToday: () => Promise<void>;
  updateGoal: (goal: number) => Promise<void>;
  updateSensitivity: (level: StepSensitivity) => Promise<void>;
  getHistoricalSteps: (daysBack: number) => Promise<{ date: string; steps: number }[]>;
}

export function useStepCounter(): StepCounterState & StepCounterActions {
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayDate, setTodayDate] = useState(getTodayString());
  const [sensitivity, setSensitivity] = useState<StepSensitivity>("medium");

  const detectorRef = useRef(new StepDetector());
  const subscriptionRef = useRef<{ remove: () => void } | null>(null);
  const stepsRef = useRef(0);
  const savingRef = useRef(false);
  const currentDayRef = useRef(getTodayString());

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const applySensitivity = useCallback((level: StepSensitivity) => {
    detectorRef.current.setThreshold(THRESHOLDS[level]);
    setSensitivity(level);
  }, []);

  const saveSteps = async (count: number) => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      await AsyncStorage.setItem(getDateKey(), String(count));
    } catch (e) {
      console.log("[Steps] Save error:", e);
    } finally {
      savingRef.current = false;
    }
  };

  const loadTodaySteps = async (): Promise<number> => {
    try {
      const saved = await AsyncStorage.getItem(getDateKey());
      if (saved !== null) {
        const count = parseInt(saved, 10);
        if (!Number.isNaN(count)) return count;
      }
    } catch (e) {
      console.log("[Steps] Load error:", e);
    }
    return 0;
  };

  const loadGoal = async () => {
    try {
      const saved = await AsyncStorage.getItem(GOAL_KEY);
      if (saved !== null) {
        const g = parseInt(saved, 10);
        if (!Number.isNaN(g) && g > 0) {
          setGoal(g);
        }
      }
    } catch {
      // ignore
    }
  };

  const loadSensitivity = async () => {
    try {
      const saved = await AsyncStorage.getItem(SENSITIVITY_KEY);
      if (saved === "low" || saved === "medium" || saved === "high") {
        applySensitivity(saved);
      }
    } catch {
      // ignore
    }
  };

  const checkDayChange = useCallback(() => {
    const today = getTodayString();
    if (today !== currentDayRef.current) {
      currentDayRef.current = today;
      setTodayDate(today);
      detectorRef.current.reset();
      stepsRef.current = 0;
      setSteps(0);
    }
  }, []);

  const startTracking = useCallback(async () => {
    if (Platform.OS === "web") {
      setError("Step tracking not available on web");
      setIsLoading(false);
      return;
    }

    try {
      const { Accelerometer } = await import("expo-sensors");

      const available = await Accelerometer.isAvailableAsync();
      setIsAvailable(available);

      if (!available) {
        setError("Accelerometer not available on this device");
        setIsLoading(false);
        return;
      }

      const savedSteps = await loadTodaySteps();
      detectorRef.current.setCount(savedSteps);
      stepsRef.current = savedSteps;
      setSteps(savedSteps);

      Accelerometer.setUpdateInterval(100);

      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }

      subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
        const today = getTodayString();
        if (today !== currentDayRef.current) {
          checkDayChange();
        }

        const stepDetected = detectorRef.current.processSample(x, y, z);

        if (stepDetected) {
          const newCount = detectorRef.current.getCount();
          stepsRef.current = newCount;
          setSteps(newCount);

          if (newCount % 20 === 0) {
            void saveSteps(newCount);
          }
        }
      });

      setIsTracking(true);
      setError(null);
    } catch (e) {
      console.log("[Steps] Error starting:", e);
      setError("Could not start step tracking");
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, [checkDayChange]);

  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsTracking(false);
    void saveSteps(stepsRef.current);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        checkDayChange();
        if (!subscriptionRef.current) {
          void startTracking();
        }
      } else if (nextState === "background" || nextState === "inactive") {
        void saveSteps(stepsRef.current);
      }
    });

    return () => subscription.remove();
  }, [checkDayChange, startTracking]);

  useEffect(() => {
    void loadGoal();
    void loadSensitivity();
    void startTracking();

    const interval = setInterval(checkDayChange, 60_000);

    return () => {
      clearInterval(interval);
      stopTracking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetToday = async () => {
    detectorRef.current.reset();
    stepsRef.current = 0;
    setSteps(0);
    await saveSteps(0);
  };

  const updateGoal = async (newGoal: number) => {
    setGoal(newGoal);
    try {
      await AsyncStorage.setItem(GOAL_KEY, String(newGoal));
    } catch {
      // ignore
    }
  };

  const updateSensitivity = async (level: StepSensitivity) => {
    applySensitivity(level);
    try {
      await AsyncStorage.setItem(SENSITIVITY_KEY, level);
    } catch {
      // ignore
    }
  };

  const getHistoricalSteps = async (
    daysBack: number
  ): Promise<{ date: string; steps: number }[]> => {
    const result: { date: string; steps: number }[] = [];
    for (let i = 0; i < daysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = getDateKey(date);
      const dateStr = date.toISOString().split("T")[0]!;
      try {
        const saved = await AsyncStorage.getItem(key);
        result.push({
          date: dateStr,
          steps: saved ? parseInt(saved, 10) : 0,
        });
      } catch {
        result.push({ date: dateStr, steps: 0 });
      }
    }
    return result;
  };

  const percentage = Math.min(100, goal > 0 ? Math.round((steps / goal) * 100) : 0);

  return {
    steps,
    goal,
    percentage,
    isAvailable,
    isTracking,
    isLoading,
    error,
    todayDate,
    sensitivity,
    startTracking,
    stopTracking,
    resetToday,
    updateGoal,
    updateSensitivity,
    getHistoricalSteps,
  };
}

export default useStepCounter;
