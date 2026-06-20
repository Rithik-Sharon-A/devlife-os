import { useState, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOAL_KEY = 'dayos:step_goal';
const MANUAL_KEY = 'dayos:steps:manual:';
const BASELINE_KEY = 'dayos:steps:baseline:';
const DEFAULT_GOAL = 8000;

const getTodayString = () =>
  new Date().toISOString().split('T')[0];

export const useStepCounter = () => {
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isManual, setIsManual] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchRef = useRef<any>(null);
  const baselineRef = useRef<number>(-1);
  const isManualRef = useRef(false);

  useEffect(() => {
    isManualRef.current = isManual;
  }, [isManual]);

  const saveBaseline = async (value: number) => {
    const today = getTodayString();
    await AsyncStorage.setItem(BASELINE_KEY + today, value.toString());
  };

  const loadBaseline = async (): Promise<number> => {
    const today = getTodayString();
    try {
      const saved = await AsyncStorage.getItem(BASELINE_KEY + today);
      if (saved !== null) {
        return parseInt(saved, 10);
      }
    } catch {}
    return -1;
  };

  const requestAndStart = async () => {
    if (Platform.OS !== 'android') {
      setIsLoading(false);
      return;
    }

    try {
      const { Pedometer } = await import('expo-sensors');

      const available = await Pedometer.isAvailableAsync();
      setIsAvailable(available);

      if (!available) {
        setError('Step counter not available');
        setIsLoading(false);
        return;
      }

      const { granted } = await Pedometer.requestPermissionsAsync();
      setHasPermission(granted);

      if (!granted) {
        setError(
          'Permission denied.\n' +
          'Go to Settings → Apps → cAI → ' +
          'Permissions → Physical Activity → Allow'
        );
        setIsLoading(false);
        return;
      }

      let baseline = await loadBaseline();

      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }

      watchRef.current = Pedometer.watchStepCount(({ steps: rawSteps }) => {
        if (isManualRef.current) return;

        console.log(
          '[Steps] Raw from sensor:',
          rawSteps,
          'Baseline:',
          baseline
        );

        if (baseline === -1) {
          baseline = rawSteps;
          baselineRef.current = rawSteps;
          void saveBaseline(rawSteps);
          console.log('[Steps] Baseline saved:', rawSteps);
          setSteps(0);
          return;
        }

        const todaySteps = Math.max(0, rawSteps - baseline);

        console.log('[Steps] Today steps:', todaySteps);
        setSteps(todaySteps);
      });

      baselineRef.current = baseline;
      setError(null);
      setIsLoading(false);
    } catch (e: any) {
      console.log('[Steps] Error:', e.message);
      setError('Could not start: ' + e.message);
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

      await requestAndStart();
    };

    init();

    const appSub = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active' && !isManualRef.current) {
        if (watchRef.current) {
          watchRef.current.remove();
          watchRef.current = null;
        }
        await requestAndStart();
      }
    });

    return () => {
      appSub.remove();
      if (watchRef.current) {
        watchRef.current.remove();
      }
    };
  }, []);

  const retryStepCounter = async () => {
    setIsLoading(true);
    setError(null);
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    await requestAndStart();
  };

  const setManualSteps = async (count: number) => {
    const today = getTodayString();
    setSteps(count);
    setIsManual(true);
    isManualRef.current = true;
    await AsyncStorage.setItem(MANUAL_KEY + today, count.toString());
  };

  const clearManualOverride = async () => {
    const today = getTodayString();
    setIsManual(false);
    isManualRef.current = false;
    await AsyncStorage.removeItem(MANUAL_KEY + today);
    await requestAndStart();
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
    hasPermission,
    error,
    retryStepCounter,
    setManualSteps,
    clearManualOverride,
    updateGoal,
    getHistoricalSteps: async (_daysBack?: number) => [],
  };
};
