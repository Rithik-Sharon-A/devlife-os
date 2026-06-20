const { withAndroidManifest } =
  require('@expo/config-plugins');

module.exports = function withActivityRecognition(
  config
) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const perms = manifest['uses-permission'];

    const needed = [
      'android.permission.ACTIVITY_RECOGNITION',
      'android.permission.BODY_SENSORS',
    ];

    needed.forEach(permission => {
      const exists = perms.some(
        p => p.$?.['android:name'] === permission
      );
      if (!exists) {
        perms.push({
          $: { 'android:name': permission }
        });
      }
    });

    return config;
  });
};
