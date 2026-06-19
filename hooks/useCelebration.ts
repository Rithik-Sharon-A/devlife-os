import { useCallback, useRef, useState } from "react";

import type { CelebrationExtraData, CelebrationType } from "../types/celebrations";

export function useCelebration() {
  const [type, setType] = useState<CelebrationType | null>(null);
  const [visible, setVisible] = useState(false);
  const [extraData, setExtraData] = useState<CelebrationExtraData>({});

  const lastCelebration = useRef("");
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback(
    (celebrationType: CelebrationType, data?: CelebrationExtraData) => {
      const key = celebrationType;
      if (lastCelebration.current === key) return;

      lastCelebration.current = key;
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
      cooldownTimer.current = setTimeout(() => {
        lastCelebration.current = "";
      }, 5000);

      setType(celebrationType);
      setExtraData(data ?? {});
      setVisible(true);
    },
    []
  );

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setType(null);
      setExtraData({});
    }, 400);
  }, []);

  return {
    celebrate,
    dismiss,
    celebrationType: type,
    isVisible: visible,
    extraData,
  };
}

export default useCelebration;
