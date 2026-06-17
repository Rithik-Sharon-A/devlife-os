// Web stub — expo-pedometer is not supported on web.
// Metro resolves this file instead of usePedometer.ts on web platform.

import { useAppStore } from "../store/useAppStore";

const DEFAULT_GOAL = 10_000;

export function usePedometer() {
  const stepLog = useAppStore((state) => state.stepLog);
  const steps = stepLog?.steps ?? 0;
  const goalSteps = stepLog?.goalSteps ?? DEFAULT_GOAL;
  const percentage = goalSteps > 0 ? Math.min(100, (steps / goalSteps) * 100) : 0;

  return {
    steps,
    goalSteps,
    percentage,
    isAvailable: false,
    permissionGranted: false,
    isSyncing: false,
    syncSteps: async () => {},
    requestPermission: async () => false,
  };
}
