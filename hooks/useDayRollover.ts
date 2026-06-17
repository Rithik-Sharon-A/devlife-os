import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useAppStore } from "../store/useAppStore";

/** Detects calendar day changes and rolls daily state forward. */
export function useDayRollover() {
  const checkDayRollover = useAppStore((s) => s.checkDayRollover);
  const isStoreInitialized = useAppStore((s) => s.isStoreInitialized);

  useEffect(() => {
    if (!isStoreInitialized) return;
    checkDayRollover();
  }, [checkDayRollover, isStoreInitialized]);

  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === "active") checkDayRollover();
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, [checkDayRollover]);
}
