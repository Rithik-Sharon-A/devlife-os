const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withBackgroundActions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const perms = manifest['uses-permission'];
    const needed = [
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_HEALTH',
      'android.permission.ACTIVITY_RECOGNITION',
      'android.permission.BODY_SENSORS',
    ];

    needed.forEach((permission) => {
      const exists = perms.some(
        (p) => p.$?.['android:name'] === permission
      );
      if (!exists) {
        perms.push({ $: { 'android:name': permission } });
      }
    });

    const application = manifest.application?.[0];
    if (application) {
      if (!application.service) {
        application.service = [];
      }

      const serviceName =
        'com.asterinet.react.bgactions.RNBackgroundActionsTask';
      const existing = application.service.find(
        (s) => s.$?.['android:name'] === serviceName
      );

      if (existing) {
        existing.$['android:foregroundServiceType'] = 'health';
      } else {
        application.service.push({
          $: {
            'android:name': serviceName,
            'android:foregroundServiceType': 'health',
          },
        });
      }
    }

    return config;
  });
};
