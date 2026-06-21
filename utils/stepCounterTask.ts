import BackgroundService from 'react-native-background-actions';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STEPS_KEY = 'dayos:steps:';

const getTodayString = () =>
  new Date().toISOString().split('T')[0];

const stepCounterTask = async (taskData?: { delay: number }) => {
  const { Pedometer } = await import('expo-sensors');

  let runningTotal = 0;
  let currentDay = getTodayString();

  try {
    const saved = await AsyncStorage.getItem(STEPS_KEY + currentDay);
    if (saved) {
      runningTotal = parseInt(saved, 10) || 0;
    }
  } catch {}

  await new Promise<void>((resolve) => {
    const subscription = Pedometer.watchStepCount(({ steps }) => {
      if (steps < 3) return;

      runningTotal += steps;

      const today = getTodayString();
      void AsyncStorage.setItem(
        STEPS_KEY + today,
        runningTotal.toString()
      );

      console.log('[BG Steps] Total:', runningTotal);
    });

    const dayCheckInterval = setInterval(() => {
      const today = getTodayString();
      if (today !== currentDay) {
        currentDay = today;
        runningTotal = 0;
        void AsyncStorage.setItem(STEPS_KEY + today, '0');
        console.log('[BG Steps] New day, reset');
      }
    }, 60000);

    const stopCheckInterval = setInterval(() => {
      if (!BackgroundService.isRunning()) {
        subscription.remove();
        clearInterval(dayCheckInterval);
        clearInterval(stopCheckInterval);
        resolve();
      }
    }, 1000);
  });
};

const backgroundOptions = {
  taskName: 'StepCounter',
  taskTitle: 'Counting your steps',
  taskDesc: 'cAI is tracking your daily steps',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#7c6aff',
  linkingURI: 'cai://health',
  foregroundServiceType: ['health' as const],
  parameters: {
    delay: 1000,
  },
};

export const startBackgroundStepCounter = async () => {
  try {
    const isRunning = BackgroundService.isRunning();
    if (!isRunning) {
      await BackgroundService.start(stepCounterTask, backgroundOptions);
      console.log('[BG Steps] Service started');
    }
  } catch (e) {
    console.log('[BG Steps] Start error:', e);
  }
};

export const stopBackgroundStepCounter = async () => {
  try {
    await BackgroundService.stop();
    console.log('[BG Steps] Service stopped');
  } catch (e) {
    console.log('[BG Steps] Stop error:', e);
  }
};

export const isStepCounterRunning = async (): Promise<boolean> => {
  try {
    return BackgroundService.isRunning();
  } catch {
    return false;
  }
};
