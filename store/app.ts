import { create } from "zustand";

interface AppState {
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  onboardingComplete: false,
  setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
}));
