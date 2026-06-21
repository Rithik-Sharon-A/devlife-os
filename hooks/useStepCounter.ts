import { useState, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  startBackgroundStepCounter,
  isStepCounterRunning,
  STEPS_KEY,
} from '../utils/stepCounterTask';

const GOAL_KEY = 'dayos:step_goal';
const MANUAL_KEY = 'dayos:steps:manual:';
const DEFAULT_GOAL = 8000;

const getTodayString = () =>
  new Date().toISOString().split('T')[0];

export const useStepCounter = () => {
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isManual, setIsManual] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isManualRef = useRef(false);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const loadStepsFromStorage = async () => {
    try {
      const today = getTodayString();
      const saved = await AsyncStorage.getItem(STEPS_KEY + today);
      if (saved !== null && !isManualRef.current) {
        const count = parseInt(saved, 10);
        setSteps(count);
        return count;
      }
    } catch {}
    return 0;
  };

  const startTracking = async () => {
    if (Platform.OS !== 'android') {
      setIsLoading(false);
      return;
    }

    try {
      const { Pedometer } = await import('expo-sensors');

      const { granted } = await Pedometer.requestPermissionsAsync();
      setHasPermission(granted);

      if (!granted) {
        setError(
          'Permission needed.\n' +
          'Go to Settings → Apps → cAI → ' +
          'Permissions → Physical Activity → Allow'
        );
        setIsLoading(false);
        return;
      }

      await startBackgroundStepCounter();

      const running = await isStepCounterRunning();
      setIsTracking(running);

      await loadStepsFromStorage();

      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      refreshIntervalRef.current = setInterval(async () => {
        if (!isManualRef.current) {
          await loadStepsFromStorage();
        }
      }, 5000);

      setError(null);
      setIsLoading(false);
    } catch (e: any) {
      console.log('[Steps] Error:', e);
      setError('Could not start step counter');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const saved = await AsyncStorage.getItem(GOAL_KEY);
        if (saved) setGoal(parseInt(saved, 10));
      } catch {}

      const today = getTodayString();
      try {
        const manual = await AsyncStorage.getItem(MANUAL_KEY + today);
        if (manual !== null) {
          setSteps(parseInt(manual, 10));
          setIsManual(true);
          isManualRef.current = true;
          setIsLoading(false);
          return;
        }
      } catch {}

      await startTracking();
    };

    init();

    const appSub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        await loadStepsFromStorage();

        let running = await isStepCounterRunning();
        if (!running && !isManualRef.current) {
          await startBackgroundStepCounter();
          running = await isStepCounterRunning();
        }
        setIsTracking(running);
      }
    });

    return () => {
      appSub.remove();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const retryStepCounter = async () => {
    setIsLoading(true);
    setError(null);
    await startTracking();
  };

  const updateGoal = async (newGoal: number) => {
    setGoal(newGoal);
    await AsyncStorage.setItem(GOAL_KEY, newGoal.toString());
  };

  const percentage = Math.min(
    100,
    goal > 0 ? Math.round((steps / goal) * 100) : 0
  );

  return {
    steps,
    goal,
    percentage,
    isAvailable,
    isLoading,
    isManual,
    isTracking,
    hasPermission,
    error,
    retryStepCounter,
    startTracking,
    updateGoal,
    getHistoricalSteps: async (_daysBack?: number) => [],
  };
};
