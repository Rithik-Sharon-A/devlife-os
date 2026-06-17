import { Redirect } from "expo-router";

import { useAppStore } from "../store/useAppStore";

export default function Index() {
  const isOnboarded = useAppStore((s) => s.isOnboarded);
  const isStoreInitialized = useAppStore((s) => s.isStoreInitialized);

  if (!isStoreInitialized) {
    return null;
  }

  if (isOnboarded) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
