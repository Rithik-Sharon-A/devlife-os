const fs = require('fs');
const path = require('path');

const pkgRoot = path.join(__dirname, '..', 'node_modules', 'react-native-sensors');

if (!fs.existsSync(pkgRoot)) {
  console.log('react-native-sensors not installed, skipping patch');
  process.exit(0);
}

try {
const patchRNSensor = (javaPath) => {
  const RNSENSOR_STEP_CASE = `
        case Sensor.TYPE_STEP_COUNTER:
          map.putDouble("steps", sensorEvent.values[0]);
          break;
`;
  if (!fs.existsSync(javaPath)) return;
  let contents = fs.readFileSync(javaPath, 'utf8');
  if (contents.includes('TYPE_STEP_COUNTER')) return;
  contents = contents.replace(
    '        case Sensor.TYPE_ROTATION_VECTOR:',
    `${RNSENSOR_STEP_CASE}
        case Sensor.TYPE_ROTATION_VECTOR:`
  );
  fs.writeFileSync(javaPath, contents);
};

const patchRNSensorsPackage = (javaPath) => {
  if (!fs.existsSync(javaPath)) return;
  let contents = fs.readFileSync(javaPath, 'utf8');
  if (contents.includes('RNSensorsStepCounter')) return;
  contents = contents.replace(
    'new RNSensor(reactContext, "RNSensorsOrientation", Sensor.TYPE_ROTATION_VECTOR)',
    `new RNSensor(reactContext, "RNSensorsStepCounter", Sensor.TYPE_STEP_COUNTER),
        new RNSensor(reactContext, "RNSensorsOrientation", Sensor.TYPE_ROTATION_VECTOR)`
  );
  fs.writeFileSync(javaPath, contents);
};

const patchIndexJs = (indexPath) => {
  if (!fs.existsSync(indexPath)) return;
  let contents = fs.readFileSync(indexPath, 'utf8');
  if (contents.includes('stepCounter')) return;
  contents = contents.replace(
    '  gravity: "gravity"\n};',
    '  gravity: "gravity",\n  stepCounter: "stepCounter"\n};'
  );
  contents = contents.replace(
    'export const { accelerometer, gyroscope, magnetometer, barometer, orientation, gravity } = sensors;',
    'export const { accelerometer, gyroscope, magnetometer, barometer, orientation, gravity, stepCounter } = sensors;'
  );
  fs.writeFileSync(indexPath, contents);
};

const patchSensorsJs = (sensorsPath) => {
  if (!fs.existsSync(sensorsPath)) return;
  let contents = fs.readFileSync(sensorsPath, 'utf8');
  if (contents.includes('stepCounter')) return;
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
};

const patchRNSensorsJs = (rnsensorsPath) => {
  if (!fs.existsSync(rnsensorsPath)) return;
  let contents = fs.readFileSync(rnsensorsPath, 'utf8');
  if (contents.includes('stepCounter')) return;
  contents = contents.replace(
    '  RNSensorsGravity: GravNative,\n} = NativeModules;',
    '  RNSensorsGravity: GravNative,\n  RNSensorsStepCounter: StepNative,\n} = NativeModules;'
  );
  contents = contents.replace(
    '  ["gravity", GravNative],\n]);',
    '  ["gravity", GravNative],\n  ["stepCounter", StepNative],\n]);'
  );
  fs.writeFileSync(rnsensorsPath, contents);
};

const patchIndexDts = (dtsPath) => {
  if (!fs.existsSync(dtsPath)) return;
  let contents = fs.readFileSync(dtsPath, 'utf8');
  if (contents.includes('stepCounter')) return;
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
};

patchRNSensor(path.join(pkgRoot, 'android/src/main/java/com/sensors/RNSensor.java'));
patchRNSensorsPackage(path.join(pkgRoot, 'android/src/main/java/com/sensors/RNSensorsPackage.java'));
patchIndexJs(path.join(pkgRoot, 'index.js'));
patchSensorsJs(path.join(pkgRoot, 'src/sensors.js'));
patchRNSensorsJs(path.join(pkgRoot, 'src/rnsensors.js'));
patchIndexDts(path.join(pkgRoot, 'index.d.ts'));

console.log('react-native-sensors stepCounter patch applied');
} catch (error) {
  console.warn('react-native-sensors patch failed:', error);
  process.exit(0);
}
