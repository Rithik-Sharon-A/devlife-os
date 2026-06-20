import { useState, useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import AsyncStorage from
  '@react-native-async-storage/async-storage';

const GOAL_KEY = 'dayos:step_goal';
const MANUAL_KEY = 'dayos:steps:manual:';
const DEFAULT_GOAL = 8000;

const getTodayString = () =>
  new Date().toISOString().split('T')[0];

const getMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const useStepCounter = () => {
  const [steps, setSteps] = useState(0);
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isManual, setIsManual] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to store baseline so watchStepCount
  // closure always has latest value
  const baselineRef = useRef(0);
  const watchRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const isManualRef = useRef(false);

  // Keep isManual ref in sync
  useEffect(() => {
    isManualRef.current = isManual;
  }, [isManual]);

  // ─────────────────────────────────
  // CORE: GET TODAY'S STEPS
  // Reads from hardware sensor
  // Returns steps from midnight to now
  // ─────────────────────────────────
  const getTodaySteps = async (): Promise<number> => {
    try {
      const { Pedometer } = await import('expo-sensors');
      const start = getMidnight();
      const end = new Date();
      const result = await Pedometer.getStepCountAsync(
        start,
        end
      );
      console.log('[Steps] getStepCountAsync:', result.steps);
      return result.steps;
    } catch (e) {
      console.log('[Steps] getStepCountAsync failed:', e);
      return 0;
    }
  };

  // ─────────────────────────────────
  // SETUP LIVE WATCH
  // Watches for new steps in real time
  // Adds to baseline from getStepCountAsync
  // ─────────────────────────────────
  const setupWatch = async () => {
    try {
      const { Pedometer } = await import('expo-sensors');

      // Remove existing watch
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }

      // Capture baseline at watch start
      // This is today's steps BEFORE watch begins
      const baseline = await getTodaySteps();
      baselineRef.current = baseline;
      
      if (!isManualRef.current) {
        setSteps(baseline);
      }

      console.log('[Steps] Watch baseline:', baseline);

      // Start watching for NEW steps
      watchRef.current = Pedometer.watchStepCount(
        ({ steps: newSteps }) => {
          if (isManualRef.current) return;
          
          // Total = what was there before + new steps
          const total = baselineRef.current + newSteps;
          console.log(
            '[Steps] Watch update:',
            'baseline:', baselineRef.current,
            '+ new:', newSteps,
            '= total:', total
          );
          setSteps(total);
        }
      );

      console.log('[Steps] Watch started ✅');
    } catch (e) {
      console.log('[Steps] Watch setup failed:', e);
    }
  };

  // ─────────────────────────────────
  // SETUP PERIODIC REFRESH
  // Every 5 minutes re-read from sensor
  // Catches steps taken while app was in bg
  // ─────────────────────────────────
  const setupPeriodicRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      if (isManualRef.current) return;
      
      const fresh = await getTodaySteps();
      if (fresh > 0) {
        // Update baseline so watch stays accurate
        baselineRef.current = fresh;
        setSteps(fresh);
        console.log('[Steps] Periodic refresh:', fresh);
      }
    }, 5 * 60 * 1000); // every 5 minutes
  };

  // ─────────────────────────────────
  // MAIN INIT: REQUEST PERMISSION + START
  // ─────────────────────────────────
  const requestAndStart = async () => {
    if (Platform.OS === 'web') {
      setIsLoading(false);
      setError('Not available on web');
      return;
    }

    try {
      const { Pedometer } = await import('expo-sensors');

      // 1. Check hardware availability
      const available = await Pedometer.isAvailableAsync();
      console.log('[Steps] Available:', available);
      setIsAvailable(available);

      if (!available) {
        setError(
          'Step counter hardware not found on this device'
        );
        setIsLoading(false);
        return;
      }

      // 2. Request permission
      const { granted } =
        await Pedometer.requestPermissionsAsync();
      console.log('[Steps] Permission granted:', granted);
      setHasPermission(granted);

      if (!granted) {
        setError(
          'Physical Activity permission needed.\n' +
          'Go to Settings → Apps → ' +
          'cAI → Permissions → ' +
          'Physical Activity → Allow'
        );
        setIsLoading(false);
        return;
      }

      // 3. Get today's steps immediately
      const todaySteps = await getTodaySteps();
      console.log('[Steps] Initial steps:', todaySteps);
      
      if (!isManualRef.current) {
        setSteps(todaySteps);
        baselineRef.current = todaySteps;
      }

      // 4. Setup live watch for new steps
      await setupWatch();

      // 5. Setup periodic refresh
      setupPeriodicRefresh();

      setError(null);
      setIsLoading(false);
      
      console.log('[Steps] All setup complete ✅');

    } catch (e: any) {
      console.log('[Steps] Fatal error:', e);
      setError('Could not start step counter: ' + e.message);
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────
  // HANDLE APP STATE CHANGES
  // Refresh when app comes to foreground
  // ─────────────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async (nextState) => {
        if (nextState === 'active' && !isManualRef.current) {
          console.log('[Steps] App active, refreshing...');
          
          // Get fresh count from sensor
          const fresh = await getTodaySteps();
          if (fresh > 0) {
            baselineRef.current = fresh;
            setSteps(fresh);
          }
          
          // Restart watch since it may have stopped
          await setupWatch();
        }
      }
    );

    return () => subscription.remove();
  }, []);

  // ─────────────────────────────────
  // CHECK MANUAL OVERRIDE
  // ─────────────────────────────────
  const checkManualOverride = async (): 
    Promise<boolean> => {
    const today = getTodayString();
    try {
      const saved = await AsyncStorage.getItem(
        MANUAL_KEY + today
      );
      if (saved !== null) {
        const count = parseInt(saved, 10);
        setSteps(count);
        setIsManual(true);
        isManualRef.current = true;
        return true;
      }
    } catch {}
    return false;
  };

  // ─────────────────────────────────
  // INITIALIZE ON MOUNT
  // ─────────────────────────────────
  useEffect(() => {
    const init = async () => {
      // Load goal
      try {
        const saved = await AsyncStorage.getItem(GOAL_KEY);
        if (saved) setGoal(parseInt(saved, 10));
      } catch {}

      // Check manual override
      const hasManual = await checkManualOverride();
      
      // Always start native counter
      // (runs alongside, ready when manual cleared)
      await requestAndStart();
      
      // If manual override, restore manual value on top
      if (hasManual) {
        const today = getTodayString();
        const saved = await AsyncStorage.getItem(
          MANUAL_KEY + today
        );
        if (saved) {
          setSteps(parseInt(saved, 10));
        }
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // ─────────────────────────────────
  // PUBLIC ACTIONS
  // ─────────────────────────────────

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
    try {
      await AsyncStorage.setItem(
        MANUAL_KEY + today,
        count.toString()
      );
    } catch {}
  };

  const clearManualOverride = async () => {
    const today = getTodayString();
    setIsManual(false);
    isManualRef.current = false;
    try {
      await AsyncStorage.removeItem(MANUAL_KEY + today);
    } catch {}
    // Restart to get fresh hardware reading
    const fresh = await getTodaySteps();
    setSteps(fresh);
    baselineRef.current = fresh;
    await setupWatch();
  };

  const updateGoal = async (newGoal: number) => {
    setGoal(newGoal);
    try {
      await AsyncStorage.setItem(
        GOAL_KEY,
        newGoal.toString()
      );
    } catch {}
  };

  const getHistoricalSteps = async (daysBack: number) => {
    const results = [];
    try {
      const { Pedometer } = await import('expo-sensors');
      for (let i = 0; i < daysBack; i++) {
        const start = new Date();
        start.setDate(start.getDate() - i);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        const dateStr = start.toISOString().split('T')[0];
        try {
          const result =
            await Pedometer.getStepCountAsync(start, end);
          results.push({
            date: dateStr,
            steps: result.steps
          });
        } catch {
          results.push({ date: dateStr, steps: 0 });
        }
      }
    } catch {}
    return results;
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
    getHistoricalSteps,
  };
};
