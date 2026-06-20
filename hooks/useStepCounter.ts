import { useState, useEffect, useRef } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NativeStepCounter from '../utils/NativeStepCounter';

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

  const listenerRef = useRef<any>(null);
  const isManualRef = useRef(false);

  useEffect(() => {
    isManualRef.current = isManual;
  }, [isManual]);

  const requestAndStart = async () => {
    if (Platform.OS !== 'android') {
      setIsLoading(false);
      return;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        {
          title: 'Step Counter Permission',
          message:
            'Allow cAI to access your step counter ' +
            'to track your daily activity.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'Allow',
        }
      );

      console.log('[Steps] Permission:', granted);

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setError(
          'Physical Activity permission denied.\n' +
          'Go to Settings → Apps → cAI → ' +
          'Permissions → Physical Activity → Allow'
        );
        setHasPermission(false);
        setIsLoading(false);
        return;
      }

      setHasPermission(true);

      const available = await NativeStepCounter.isAvailable();
      console.log('[Steps] Available:', available);
      setIsAvailable(available);

      if (!available) {
        setError('Step counter sensor not found');
        setIsLoading(false);
        return;
      }

      await NativeStepCounter.startListening();
      console.log('[Steps] Listening started');

      if (listenerRef.current) {
        listenerRef.current.remove();
      }

      listenerRef.current = NativeStepCounter.addStepListener(
        (newSteps) => {
          if (!isManualRef.current) {
            console.log('[Steps] Update:', newSteps);
            setSteps(newSteps);
          }
        }
      );

      const current = await NativeStepCounter.getSteps();
      if (current > 0 && !isManualRef.current) {
        setSteps(current);
      }

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
        }
      } catch {}

      await requestAndStart();
    };

    init();

    const sub = AppState.addEventListener('change', async (state) => {
      if (state === 'active' && !isManualRef.current) {
        const current = await NativeStepCounter.getSteps();
        if (current > 0) setSteps(current);
      }
    });

    return () => {
      sub.remove();
      if (listenerRef.current) {
        listenerRef.current.remove();
      }
      NativeStepCounter.stopListening();
    };
  }, []);

  const retryStepCounter = async () => {
    setIsLoading(true);
    setError(null);
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
    const current = await NativeStepCounter.getSteps();
    setSteps(current);
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
