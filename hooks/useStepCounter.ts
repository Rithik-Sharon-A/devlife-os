import { useState, useEffect, useRef } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GOAL_KEY = 'dayos:step_goal';
const MANUAL_KEY = 'dayos:steps:manual:';
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

  const subscriptionRef = useRef<any>(null);
  const initialStepsRef = useRef<number>(-1);
  const isManualRef = useRef(false);

  useEffect(() => {
    isManualRef.current = isManual;
  }, [isManual]);

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        {
          title: 'Step Counter',
          message:
            'cAI needs access to your step counter ' +
            'to track your daily activity.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        }
      );
      const ok = granted === PermissionsAndroid.RESULTS.GRANTED;
      setHasPermission(ok);
      return ok;
    } catch {
      return false;
    }
  };

  const requestAndStart = async () => {
    try {
      const granted = await requestPermission();
      if (!granted) {
        setError(
          'Permission denied.\nGo to Settings → ' +
          'Apps → cAI → Permissions → ' +
          'Physical Activity → Allow'
        );
        setIsLoading(false);
        return;
      }

      const { stepCounter, SensorTypes, setUpdateIntervalForType } =
        await import('react-native-sensors');

      setUpdateIntervalForType(SensorTypes.stepCounter, 1000);
      setIsAvailable(true);

      const subscription = stepCounter.subscribe({
        next: ({ steps: rawSteps }: { steps: number }) => {
          if (isManualRef.current) return;

          if (initialStepsRef.current === -1) {
            initialStepsRef.current = rawSteps;
            console.log('[Steps] Baseline:', rawSteps);
          }

          const todaySteps = rawSteps - initialStepsRef.current;

          console.log(
            '[Steps] Raw:', rawSteps,
            'Baseline:', initialStepsRef.current,
            'Today:', todaySteps
          );

          setSteps(todaySteps);
        },
        error: (err: Error) => {
          console.log('[Steps] Sensor error:', err);
          setError('Step counter error: ' + err.message);
          setIsAvailable(false);
        },
      });

      subscriptionRef.current = subscription;
      setError(null);
      setIsLoading(false);
    } catch (e: any) {
      console.log('[Steps] Fatal:', e);
      setError('Could not start: ' + e.message);
      setIsAvailable(false);
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

    const appSub = AppState.addEventListener('change', async (state) => {
      if (state === 'active' && !isManualRef.current) {
        if (!subscriptionRef.current) {
          await requestAndStart();
        }
      }
    });

    return () => {
      appSub.remove();
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const retryStepCounter = async () => {
    setIsLoading(true);
    setError(null);
    initialStepsRef.current = -1;
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
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
    initialStepsRef.current = -1;
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
