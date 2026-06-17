import { useEffect } from "react";

import { useNotifications } from "../hooks/useNotifications";
import { usePedometer } from "../hooks/usePedometer";

/** Mounts side-effect hooks for notifications and step counting at app root. */
export function AppBootstrap() {
  const { requestPermission } = useNotifications();
  usePedometer();

  useEffect(() => {
    void requestPermission();
  }, [requestPermission]);

  return null;
}
