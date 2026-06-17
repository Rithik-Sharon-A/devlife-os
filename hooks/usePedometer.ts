import { useState } from 'react';

// expo-pedometer is not available in Expo Go (SDK 54).
// Will be enabled in a development build (Phase 19).
export function usePedometer() {
  const [steps] = useState(0);
  const goalSteps = 8000;
  const isAvailable = false;
  const permissionGranted = false;
  const percentage = 0;

  return { steps, goalSteps, percentage, isAvailable, permissionGranted };
}

export default usePedometer;
