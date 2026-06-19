import { Redirect, type Href } from "expo-router";
import { useEffect, useState } from "react";

import { useAppStore } from "../store/useAppStore";
import { shouldShowMorningRitual } from "../utils/morningRitual";

export default function Index() {
  const isOnboarded = useAppStore((s) => s.isOnboarded);
  const isStoreInitialized = useAppStore((s) => s.isStoreInitialized);
  const [checked, setChecked] = useState(false);
  const [showMorning, setShowMorning] = useState(false);

  useEffect(() => {
    if (!isStoreInitialized || !isOnboarded) {
      setChecked(true);
      return;
    }

    void shouldShowMorningRitual().then((show) => {
      setShowMorning(show);
      setChecked(true);
    });
  }, [isOnboarded, isStoreInitialized]);

  if (!isStoreInitialized || !checked) {
    return null;
  }

  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  if (showMorning) {
    return <Redirect href={"/morning" as Href} />;
  }

  return <Redirect href="/(tabs)" />;
}
