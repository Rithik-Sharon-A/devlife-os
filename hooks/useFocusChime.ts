import { Audio } from "expo-av";
import { useCallback, useEffect, useRef } from "react";

const CHIME_URI =
  "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";

export function useFocusChime() {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    void Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });

    return () => {
      void soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, []);

  const playChime = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: CHIME_URI },
        { shouldPlay: true, volume: 0.6 }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          void sound.setPositionAsync(0);
        }
      });
    } catch {
      // optional sound — ignore playback failures
    }
  }, []);

  return { playChime };
}
