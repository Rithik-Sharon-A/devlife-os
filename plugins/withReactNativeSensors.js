const { withAndroidManifest, withDangerousMod } =
  require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const RNSENSOR_STEP_CASE = `
        case Sensor.TYPE_STEP_COUNTER:
          map.putDouble("steps", sensorEvent.values[0]);
          break;
`;

function patchRNSensor(javaPath) {
  if (!fs.existsSync(javaPath)) return false;
  let contents = fs.readFileSync(javaPath, 'utf8');
  if (contents.includes('TYPE_STEP_COUNTER')) return true;

  contents = contents.replace(
    '        case Sensor.TYPE_ROTATION_VECTOR:',
    `${RNSENSOR_STEP_CASE}
        case Sensor.TYPE_ROTATION_VECTOR:`
  );
  fs.writeFileSync(javaPath, contents);
  return true;
}

function patchRNSensorsPackage(javaPath) {
  if (!fs.existsSync(javaPath)) return false;
  let contents = fs.readFileSync(javaPath, 'utf8');
  if (contents.includes('RNSensorsStepCounter')) return true;

  contents = contents.replace(
    'new RNSensor(reactContext, "RNSensorsOrientation", Sensor.TYPE_ROTATION_VECTOR)',
    `new RNSensor(reactContext, "RNSensorsStepCounter", Sensor.TYPE_STEP_COUNTER),
        new RNSensor(reactContext, "RNSensorsOrientation", Sensor.TYPE_ROTATION_VECTOR)`
  );
  fs.writeFileSync(javaPath, contents);
  return true;
}

function patchIndexJs(indexPath) {
  if (!fs.existsSync(indexPath)) return false;
  let contents = fs.readFileSync(indexPath, 'utf8');
  if (contents.includes('stepCounter')) return true;

  contents = contents.replace(
    '  gravity: "gravity"\n};',
    '  gravity: "gravity",\n  stepCounter: "stepCounter"\n};'
  );
  contents = contents.replace(
    'export const { accelerometer, gyroscope, magnetometer, barometer, orientation, gravity } = sensors;',
    'export const { accelerometer, gyroscope, magnetometer, barometer, orientation, gravity, stepCounter } = sensors;'
  );
  fs.writeFileSync(indexPath, contents);
  return true;
}

function patchRNSensorsJs(rnsensorsPath) {
  if (!fs.existsSync(rnsensorsPath)) return false;
  let contents = fs.readFileSync(rnsensorsPath, 'utf8');
  if (contents.includes('stepCounter')) return true;

  contents = contents.replace(
    '  RNSensorsGravity: GravNative,\n} = NativeModules;',
    '  RNSensorsGravity: GravNative,\n  RNSensorsStepCounter: StepNative,\n} = NativeModules;'
  );
  contents = contents.replace(
    '  ["gravity", GravNative],\n]);',
    '  ["gravity", GravNative],\n  ["stepCounter", StepNative],\n]);'
  );
  fs.writeFileSync(rnsensorsPath, contents);
  return true;
}

function patchSensorsJs(sensorsPath) {
  if (!fs.existsSync(sensorsPath)) return false;
  let contents = fs.readFileSync(sensorsPath, 'utf8');
  if (contents.includes('stepCounter')) return true;

  contents = contents.replace(
    '  RNSensorsGravity: GravNative,\n} = NativeModules;',
    '  RNSensorsGravity: GravNative,\n  RNSensorsStepCounter: StepNative,\n} = NativeModules;'
  );
  contents = contents.replace(
    '  ["gravity", "RNSensorsGravity"],\n]);',
    '  ["gravity", "RNSensorsGravity"],\n  ["stepCounter", "RNSensorsStepCounter"],\n]);'
  );
  contents = contents.replace(
    '  ["gravity", GravNative],\n]);',
    '  ["gravity", GravNative],\n  ["stepCounter", StepNative],\n]);'
  );
  contents = contents.replace(
    '  ["gravity", null],\n]);',
    '  ["gravity", null],\n  ["stepCounter", null],\n]);'
  );
  contents = contents.replace(
    'const gravity = createSensorObservable("gravity");',
    'const gravity = createSensorObservable("gravity");\nconst stepCounter = createSensorObservable("stepCounter");'
  );
  contents = contents.replace(
    '  gravity,\n};',
    '  gravity,\n  stepCounter,\n};'
  );
  fs.writeFileSync(sensorsPath, contents);
  return true;
}

function patchIndexDts(dtsPath) {
  if (!fs.existsSync(dtsPath)) return false;
  let contents = fs.readFileSync(dtsPath, 'utf8');
  if (contents.includes('stepCounter')) return true;

  contents = contents.replace(
    '    gravity: "gravity";\n  };',
    '    gravity: "gravity";\n    stepCounter: "stepCounter";\n  };'
  );
  contents = contents.replace(
    '  export interface OrientationData {',
    `  export interface StepCounterData {
    steps: number;
    timestamp: number;
  }

  export interface OrientationData {`
  );
  contents = contents.replace(
    '    gravity: Observable<SensorData>\n  };',
    '    gravity: Observable<SensorData>;\n    stepCounter: Observable<StepCounterData>;\n  };'
  );
  contents = contents.replace(
    '  export const { accelerometer, gyroscope, magnetometer, barometer, orientation, gravity }: SensorsBase;',
    '  export const { accelerometer, gyroscope, magnetometer, barometer, orientation, gravity, stepCounter }: SensorsBase;'
  );
  fs.writeFileSync(dtsPath, contents);
  return true;
}

module.exports = function withReactNativeSensors(
  config,
  props = {}
) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }
    const perms = manifest['uses-permission'];
    const needed = [
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
    return config;
  });

  if (props.MotionUsageDescription) {
    config = withAndroidManifest(config, (config) => {
      return config;
    });
  }

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const pkgRoot = path.join(
        projectRoot,
        'node_modules',
        'react-native-sensors'
      );

      patchRNSensor(
        path.join(
          pkgRoot,
          'android/src/main/java/com/sensors/RNSensor.java'
        )
      );
      patchRNSensorsPackage(
        path.join(
          pkgRoot,
          'android/src/main/java/com/sensors/RNSensorsPackage.java'
        )
      );
      patchIndexJs(path.join(pkgRoot, 'index.js'));
      patchSensorsJs(path.join(pkgRoot, 'src/sensors.js'));
      patchRNSensorsJs(path.join(pkgRoot, 'src/rnsensors.js'));
      patchIndexDts(path.join(pkgRoot, 'index.d.ts'));

      return config;
    },
  ]);

  return config;
};
