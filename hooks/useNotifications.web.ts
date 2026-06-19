// Web stub — expo-notifications is not supported on web.
// Metro resolves this file instead of useNotifications.ts on web platform.

export const useNotifications = () => {
  const requestPermission = async () => false;

  const scheduleLocal = async () => {};

  const cancelAll = async () => {};

  return {
    requestPermission,
    scheduleLocal,
    cancelAll,
    isSupported: false,
  };
};

export default useNotifications;
