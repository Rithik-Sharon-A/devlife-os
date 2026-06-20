import {
  NativeModules,
  NativeEventEmitter,
  Platform,
} from 'react-native';

const { StepCounter } = NativeModules;

let emitter: NativeEventEmitter | null = null;

if (StepCounter && Platform.OS === 'android') {
  emitter = new NativeEventEmitter(StepCounter);
}

export const NativeStepCounter = {
  isAvailable: async (): Promise<boolean> => {
    if (!StepCounter) return false;
    try {
      return await StepCounter.isAvailable();
    } catch {
      return false;
    }
  },

  startListening: async (): Promise<boolean> => {
    if (!StepCounter) return false;
    try {
      return await StepCounter.startListening();
    } catch {
      return false;
    }
  },

  stopListening: async (): Promise<void> => {
    if (!StepCounter) return;
    try {
      await StepCounter.stopListening();
    } catch {}
  },

  getSteps: async (): Promise<number> => {
    if (!StepCounter) return 0;
    try {
      return await StepCounter.getSteps();
    } catch {
      return 0;
    }
  },

  addStepListener: (callback: (steps: number) => void) => {
    if (!emitter) return { remove: () => {} };
    return emitter.addListener('StepCounterUpdate', callback);
  },
};

export default NativeStepCounter;
