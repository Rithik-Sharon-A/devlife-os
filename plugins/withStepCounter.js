const {
  withAndroidManifest,
  withMainApplication,
  withDangerousMod,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const STEP_COUNTER_MODULE = `
package com.dayos.app;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class StepCounterModule
  extends ReactContextBaseJavaModule
  implements SensorEventListener {

  private SensorManager sensorManager;
  private Sensor stepCounterSensor;
  private int totalSteps = 0;
  private int initialSteps = -1;
  private boolean isListening = false;
  private ReactApplicationContext reactContext;

  public StepCounterModule(
    ReactApplicationContext context
  ) {
    super(context);
    this.reactContext = context;
    sensorManager = (SensorManager)
      context.getSystemService(Context.SENSOR_SERVICE);
    stepCounterSensor = sensorManager.getDefaultSensor(
      Sensor.TYPE_STEP_COUNTER
    );
  }

  @Override
  public String getName() {
    return "StepCounter";
  }

  @ReactMethod
  public void addListener(String eventName) {}

  @ReactMethod
  public void removeListeners(Integer count) {}

  @ReactMethod
  public void isAvailable(Promise promise) {
    promise.resolve(stepCounterSensor != null);
  }

  @ReactMethod
  public void startListening(Promise promise) {
    if (stepCounterSensor == null) {
      promise.reject("NO_SENSOR",
        "Step counter sensor not available");
      return;
    }

    if (!isListening) {
      sensorManager.registerListener(
        this,
        stepCounterSensor,
        SensorManager.SENSOR_DELAY_NORMAL
      );
      isListening = true;
    }
    promise.resolve(true);
  }

  @ReactMethod
  public void stopListening(Promise promise) {
    if (isListening) {
      sensorManager.unregisterListener(this);
      isListening = false;
      initialSteps = -1;
    }
    promise.resolve(true);
  }

  @ReactMethod
  public void getSteps(Promise promise) {
    promise.resolve(totalSteps);
  }

  @Override
  public void onSensorChanged(SensorEvent event) {
    if (event.sensor.getType() ==
        Sensor.TYPE_STEP_COUNTER) {

      int rawSteps = (int) event.values[0];

      if (initialSteps == -1) {
        initialSteps = rawSteps;
      }

      totalSteps = rawSteps - initialSteps;

      if (reactContext.hasActiveReactInstance()) {
        reactContext
          .getJSModule(
            DeviceEventManagerModule
            .RCTDeviceEventEmitter.class
          )
          .emit("StepCounterUpdate", totalSteps);
      }
    }
  }

  @Override
  public void onAccuracyChanged(
    Sensor sensor, int accuracy
  ) {}
}
`;

const STEP_COUNTER_PACKAGE = `
package com.dayos.app;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class StepCounterPackage implements ReactPackage {
  @Override
  public List<NativeModule> createNativeModules(
    ReactApplicationContext reactContext
  ) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new StepCounterModule(reactContext));
    return modules;
  }

  @Override
  public List<ViewManager> createViewManagers(
    ReactApplicationContext reactContext
  ) {
    return Collections.emptyList();
  }
}
`;

module.exports = function withStepCounter(config) {
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

  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    const importLine = 'import com.dayos.app.StepCounterPackage';

    if (!contents.includes('StepCounterPackage')) {
      if (!contents.includes(importLine)) {
        contents = contents.replace(
          /^(package .+\r?\n)/m,
          `$1\n${importLine}\n`
        );
      }

      if (contents.includes('return packages')) {
        contents = contents.replace(
          /(\s*)return packages/,
          `$1packages.add(StepCounterPackage())\n$1return packages`
        );
      }
    }

    config.modResults.contents = contents;
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const packageDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java/com/dayos/app'
      );

      fs.mkdirSync(packageDir, { recursive: true });

      fs.writeFileSync(
        path.join(packageDir, 'StepCounterModule.java'),
        STEP_COUNTER_MODULE
      );

      fs.writeFileSync(
        path.join(packageDir, 'StepCounterPackage.java'),
        STEP_COUNTER_PACKAGE
      );

      return config;
    },
  ]);

  return config;
};
