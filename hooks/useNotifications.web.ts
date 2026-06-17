// Web stub — expo-notifications is not supported on web.
// Metro resolves this file instead of useNotifications.ts on web platform.

export const useNotifications = () => {
  const requestPermission = async () => false;

  const scheduleLocalNotification = async () => {};

  const cancelAll = async () => {};

  return {
    requestPermission,
    scheduleLocalNotification,
    cancelAll,
  };
};

export default useNotifications;
