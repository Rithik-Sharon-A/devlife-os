import { Platform } from "react-native";

export const useNotifications = () => {
  const requestPermission = async () => {
    try {
      if (Platform.OS === "web") return false;
      const { default: Notifications } = await import("expo-notifications");
      const { status } = await Notifications.requestPermissionsAsync();
      return status === "granted";
    } catch {
      return false;
    }
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    seconds: number
  ) => {
    try {
      if (Platform.OS === "web") return;
      const { default: Notifications } = await import("expo-notifications");
      await Notifications.scheduleNotificationAsync({
        content: { title, body },
        trigger: { seconds },
      });
    } catch (e) {
      console.log("Notification skipped:", e);
    }
  };

  const cancelAll = async () => {
    try {
      if (Platform.OS === "web") return;
      const { default: Notifications } = await import("expo-notifications");
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {}
  };

  return {
    requestPermission,
    scheduleLocalNotification,
    cancelAll,
  };
};

export default useNotifications;
