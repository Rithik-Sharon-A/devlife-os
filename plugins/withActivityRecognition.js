const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withActivityRecognition(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const manifest = androidManifest.manifest;

    if (!manifest["uses-permission"]) {
      manifest["uses-permission"] = [];
    }

    const permissions = manifest["uses-permission"];

    const hasPermission = permissions.some(
      (p) => p.$?.["android:name"] === "android.permission.ACTIVITY_RECOGNITION"
    );

    if (!hasPermission) {
      permissions.push({
        $: {
          "android:name": "android.permission.ACTIVITY_RECOGNITION",
        },
      });
    }

    const hasBodySensors = permissions.some(
      (p) => p.$?.["android:name"] === "android.permission.BODY_SENSORS"
    );

    if (!hasBodySensors) {
      permissions.push({
        $: {
          "android:name": "android.permission.BODY_SENSORS",
        },
      });
    }

    return config;
  });
};
