import { Platform } from "react-native";

const isExpoGo = (): boolean => {
  try {
    const Constants = require("expo-constants").default;
    return (
      Constants.appOwnership === "expo" ||
      Constants.executionEnvironment === "storeClient"
    );
  } catch {
    return true;
  }
};

export const useNotifications = () => {
  const requestPermission = async () => {
    if (Platform.OS === "web" || isExpoGo()) return false;
    try {
      const Notif = require("expo-notifications");
      const { status } = await Notif.requestPermissionsAsync();
      return status === "granted";
    } catch {
      return false;
    }
  };

  const scheduleLocal = async (title: string, body: string, seconds: number) => {
    if (Platform.OS === "web" || isExpoGo()) return;
    try {
      const Notif = require("expo-notifications");
      await Notif.scheduleNotificationAsync({
        content: { title, body },
        trigger: { seconds },
      });
    } catch {}
  };

  const cancelAll = async () => {
    if (Platform.OS === "web" || isExpoGo()) return;
    try {
      const Notif = require("expo-notifications");
      await Notif.cancelAllScheduledNotificationsAsync();
    } catch {}
  };

  return {
    requestPermission,
    scheduleLocal,
    cancelAll,
    isSupported: !isExpoGo() && Platform.OS !== "web",
  };
};

export default useNotifications;
