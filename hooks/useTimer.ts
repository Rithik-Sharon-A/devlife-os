import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { MMKV } from "react-native-mmkv";

import { useAppStore } from "../store/useAppStore";
import type { FocusSessionType } from "../types";

const TIMER_STORAGE_KEY = "pomodoro_timer_state";

const timerMmkv = new MMKV({ id: "dayos-timer" });

interface PersistedTimerState {
  secondsLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  sessionType: FocusSessionType;
  sessionNumber: number;
  savedAt: number;
  taskId?: string;
}

function loadPersistedState(): PersistedTimerState | null {
  try {
    const raw = timerMmkv.getString(TIMER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedTimerState;
  } catch {
    return null;
  }
}

function savePersistedState(state: PersistedTimerState): void {
  try {
    timerMmkv.set(TIMER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore persistence errors
  }
}

function clearPersistedState(): void {
  try {
    timerMmkv.delete(TIMER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function sessionDurationSeconds(
  sessionType: FocusSessionType,
  workMinutes: number,
  breakMinutes: number
): number {
  return (sessionType === "work" ? workMinutes : breakMinutes) * 60;
}

export function useTimer(
  taskId?: string,
  options?: { onSessionComplete?: () => void }
) {
  const focusConfig = useAppStore((state) => state.focusConfig);
  const startFocusSession = useAppStore((state) => state.startFocusSession);
  const completeFocusSession = useAppStore(
    (state) => state.completeFocusSession
  );
  const logBreakSession = useAppStore((state) => state.logBreakSession);
  const resetFocusSession = useAppStore((state) => state.resetFocusSession);
  const activeFocusSession = useAppStore((state) => state.activeFocusSession);

  const onSessionCompleteRef = useRef(options?.onSessionComplete);
  onSessionCompleteRef.current = options?.onSessionComplete;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const taskIdRef = useRef(taskId);
  taskIdRef.current = taskId;

  const [secondsLeft, setSecondsLeft] = useState(() => {
    const saved = loadPersistedState();
    if (saved) return saved.secondsLeft;
    return focusConfig.workMinutes * 60;
  });

  const [isRunning, setIsRunning] = useState(() => {
    return loadPersistedState()?.isRunning ?? false;
  });

  const [isPaused, setIsPaused] = useState(() => {
    return loadPersistedState()?.isPaused ?? false;
  });

  const [sessionType, setSessionType] = useState<FocusSessionType>(() => {
    return loadPersistedState()?.sessionType ?? "work";
  });

  const [sessionNumber, setSessionNumber] = useState(() => {
    return loadPersistedState()?.sessionNumber ?? 1;
  });

  const persistSnapshot = useCallback(
    (
      overrides: Partial<PersistedTimerState> & {
        secondsLeft: number;
        isRunning: boolean;
        isPaused: boolean;
        sessionType: FocusSessionType;
        sessionNumber: number;
      }
    ) => {
      savePersistedState({
        savedAt: Date.now(),
        taskId: taskIdRef.current ?? activeFocusSession?.taskId,
        ...overrides,
      });
    },
    [activeFocusSession?.taskId]
  );

  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fireSessionCompleteHaptic = useCallback(async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // haptics unavailable on web/simulator
    }
    onSessionCompleteRef.current?.();
  }, []);

  const switchSession = useCallback(
    (completedType: FocusSessionType) => {
      if (completedType === "work") {
        void fireSessionCompleteHaptic();
        completeFocusSession();

        setSessionType("break");
        setSecondsLeft(
          sessionDurationSeconds(
            "break",
            focusConfig.workMinutes,
            focusConfig.breakMinutes
          )
        );
        setIsRunning(false);
        setIsPaused(false);
        persistSnapshot({
          secondsLeft:
            focusConfig.breakMinutes * 60,
          isRunning: false,
          isPaused: false,
          sessionType: "break",
          sessionNumber,
        });
        return;
      }

      void fireSessionCompleteHaptic();
      logBreakSession(focusConfig.breakMinutes);
      const nextSessionNumber = sessionNumber + 1;

      setSessionType("work");
      setSessionNumber(nextSessionNumber);
      setSecondsLeft(
        sessionDurationSeconds(
          "work",
          focusConfig.workMinutes,
          focusConfig.breakMinutes
        )
      );
      setIsRunning(false);
      setIsPaused(false);
      persistSnapshot({
        secondsLeft: focusConfig.workMinutes * 60,
        isRunning: false,
        isPaused: false,
        sessionType: "work",
        sessionNumber: nextSessionNumber,
      });
    },
    [
      completeFocusSession,
      fireSessionCompleteHaptic,
      focusConfig.breakMinutes,
      focusConfig.workMinutes,
      logBreakSession,
      persistSnapshot,
      sessionNumber,
    ]
  );

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        clearIntervalRef();
        setIsRunning(false);
        setIsPaused(false);

        if (sessionType === "work") {
          switchSession("work");
        } else {
          switchSession("break");
        }

        return 0;
      }

      const next = prev - 1;
      persistSnapshot({
        secondsLeft: next,
        isRunning: true,
        isPaused: false,
        sessionType,
        sessionNumber,
      });
      return next;
    });
  }, [
    clearIntervalRef,
    persistSnapshot,
    sessionNumber,
    sessionType,
    switchSession,
  ]);

  const startInterval = useCallback(() => {
    clearIntervalRef();
    intervalRef.current = setInterval(tick, 1000);
  }, [clearIntervalRef, tick]);

  const start = useCallback(() => {
    if (sessionType === "work" && !activeFocusSession) {
      startFocusSession(
        taskIdRef.current,
        Math.max(1, Math.ceil(secondsLeft / 60))
      );
    }

    setIsRunning(true);
    setIsPaused(false);
    startInterval();
    persistSnapshot({
      secondsLeft,
      isRunning: true,
      isPaused: false,
      sessionType,
      sessionNumber,
    });
  }, [
    activeFocusSession,
    persistSnapshot,
    secondsLeft,
    sessionNumber,
    sessionType,
    startFocusSession,
    startInterval,
  ]);

  const pause = useCallback(() => {
    clearIntervalRef();
    setIsRunning(false);
    setIsPaused(true);
    persistSnapshot({
      secondsLeft,
      isRunning: false,
      isPaused: true,
      sessionType,
      sessionNumber,
    });
  }, [
    clearIntervalRef,
    persistSnapshot,
    secondsLeft,
    sessionNumber,
    sessionType,
  ]);

  const resume = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    startInterval();
    persistSnapshot({
      secondsLeft,
      isRunning: true,
      isPaused: false,
      sessionType,
      sessionNumber,
    });
  }, [
    persistSnapshot,
    secondsLeft,
    sessionNumber,
    sessionType,
    startInterval,
  ]);

  const reset = useCallback(() => {
    clearIntervalRef();
    resetFocusSession();

    const initialSeconds = focusConfig.workMinutes * 60;
    setSecondsLeft(initialSeconds);
    setIsRunning(false);
    setIsPaused(false);
    setSessionType("work");
    setSessionNumber(1);
    clearPersistedState();
  }, [clearIntervalRef, focusConfig.workMinutes, resetFocusSession]);

  const skip = useCallback(() => {
    clearIntervalRef();
    setIsRunning(false);
    setIsPaused(false);

    if (sessionType === "work") {
      resetFocusSession();
      setSessionType("break");
      setSecondsLeft(focusConfig.breakMinutes * 60);
      persistSnapshot({
        secondsLeft: focusConfig.breakMinutes * 60,
        isRunning: false,
        isPaused: false,
        sessionType: "break",
        sessionNumber,
      });
      return;
    }

    const nextSessionNumber = sessionNumber + 1;
    setSessionType("work");
    setSessionNumber(nextSessionNumber);
    setSecondsLeft(focusConfig.workMinutes * 60);
    persistSnapshot({
      secondsLeft: focusConfig.workMinutes * 60,
      isRunning: false,
      isPaused: false,
      sessionType: "work",
      sessionNumber: nextSessionNumber,
    });
  }, [
    clearIntervalRef,
    focusConfig.breakMinutes,
    focusConfig.workMinutes,
    persistSnapshot,
    resetFocusSession,
    sessionNumber,
    sessionType,
  ]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      startInterval();
    }
    return clearIntervalRef;
  }, [clearIntervalRef, isPaused, isRunning, startInterval]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "background" || nextState === "inactive") {
        persistSnapshot({
          secondsLeft,
          isRunning,
          isPaused,
          sessionType,
          sessionNumber,
        });
        return;
      }

      if (nextState !== "active") return;

      const saved = loadPersistedState();
      if (!saved || !saved.isRunning || saved.isPaused) return;

      const elapsed = Math.floor((Date.now() - saved.savedAt) / 1000);
      if (elapsed <= 0) return;

      let remaining = saved.secondsLeft - elapsed;
      let type = saved.sessionType;
      let number = saved.sessionNumber;

      while (remaining <= 0) {
        if (type === "work") {
          completeFocusSession();
          type = "break";
          remaining +=
            sessionDurationSeconds(
              "break",
              focusConfig.workMinutes,
              focusConfig.breakMinutes
            );
        } else {
          number += 1;
          type = "work";
          remaining +=
            sessionDurationSeconds(
              "work",
              focusConfig.workMinutes,
              focusConfig.breakMinutes
            );
        }
      }

      setSecondsLeft(Math.max(0, remaining));
      setSessionType(type);
      setSessionNumber(number);
      setIsRunning(true);
      setIsPaused(false);

      persistSnapshot({
        secondsLeft: Math.max(0, remaining),
        isRunning: true,
        isPaused: false,
        sessionType: type,
        sessionNumber: number,
      });
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [
    completeFocusSession,
    focusConfig.breakMinutes,
    focusConfig.workMinutes,
    isPaused,
    isRunning,
    persistSnapshot,
    secondsLeft,
    sessionNumber,
    sessionType,
  ]);

  const setWorkDuration = useCallback(
    (minutes: number) => {
      if (isRunning || isPaused || sessionType !== "work") return;

      const seconds = Math.max(1, minutes) * 60;
      setSecondsLeft(seconds);
      persistSnapshot({
        secondsLeft: seconds,
        isRunning: false,
        isPaused: false,
        sessionType: "work",
        sessionNumber,
      });
    },
    [isPaused, isRunning, persistSnapshot, sessionNumber, sessionType]
  );

  return {
    secondsLeft,
    isRunning,
    isPaused,
    sessionType,
    sessionNumber,
    start,
    pause,
    resume,
    reset,
    skip,
    setWorkDuration,
  };
}
