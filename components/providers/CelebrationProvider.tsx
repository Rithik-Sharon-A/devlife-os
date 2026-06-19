import {
  createContext,
  useContext,
  useEffect,
  type PropsWithChildren,
} from "react";

import { useCelebration } from "../../hooks/useCelebration";
import { useAppStore } from "../../store/useAppStore";
import type { CelebrationExtraData, CelebrationType } from "../../types/celebrations";
import CelebrationOverlay from "../ui/CelebrationOverlay";

type CelebrationContextValue = ReturnType<typeof useCelebration>;

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

export function CelebrationProvider({ children }: PropsWithChildren) {
  const celebration = useCelebration();
  const setCelebrationCallback = useAppStore((s) => s.setCelebrationCallback);

  useEffect(() => {
    setCelebrationCallback((type: CelebrationType, data?: CelebrationExtraData) => {
      celebration.celebrate(type, data);
    });
    return () => setCelebrationCallback(null);
  }, [celebration.celebrate, setCelebrationCallback]);

  return (
    <CelebrationContext.Provider value={celebration}>
      {children}
      <CelebrationOverlay
        type={celebration.celebrationType}
        visible={celebration.isVisible}
        onDismiss={celebration.dismiss}
        extraData={celebration.extraData}
      />
    </CelebrationContext.Provider>
  );
}

export function useCelebrationContext(): CelebrationContextValue {
  const ctx = useContext(CelebrationContext);
  if (!ctx) {
    throw new Error("useCelebrationContext must be used within CelebrationProvider");
  }
  return ctx;
}
