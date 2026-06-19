/**
 * Step Detection using accelerometer
 * Algorithm: Peak detection on magnitude
 *
 * 1. Read x, y, z from accelerometer
 * 2. Calculate magnitude = sqrt(x²+y²+z²)
 * 3. Smooth with moving average (reduces noise)
 * 4. Detect when magnitude crosses threshold going up then down = 1 step
 * 5. Enforce minimum time between steps (prevents double counting)
 */
export class StepDetector {
  private threshold = 1.15;
  private isAboveThreshold = false;
  private stepCount = 0;
  private magnitudeBuffer: number[] = [];
  private bufferSize = 4;
  private minStepInterval = 280;
  private lastStepTimestamp = 0;

  processSample(x: number, y: number, z: number): boolean {
    const raw = Math.sqrt(x * x + y * y + z * z);

    this.magnitudeBuffer.push(raw);
    if (this.magnitudeBuffer.length > this.bufferSize) {
      this.magnitudeBuffer.shift();
    }
    const smoothed =
      this.magnitudeBuffer.reduce((a, b) => a + b, 0) / this.magnitudeBuffer.length;

    const now = Date.now();
    let stepDetected = false;

    if (smoothed > this.threshold) {
      if (!this.isAboveThreshold) {
        this.isAboveThreshold = true;
      }
    } else if (this.isAboveThreshold) {
      this.isAboveThreshold = false;

      const timeSinceLast = now - this.lastStepTimestamp;
      if (timeSinceLast >= this.minStepInterval) {
        this.stepCount++;
        this.lastStepTimestamp = now;
        stepDetected = true;
      }
    }

    return stepDetected;
  }

  getCount(): number {
    return this.stepCount;
  }

  setCount(count: number): void {
    this.stepCount = count;
  }

  reset(): void {
    this.stepCount = 0;
    this.magnitudeBuffer = [];
    this.isAboveThreshold = false;
    this.lastStepTimestamp = 0;
  }

  setThreshold(value: number): void {
    this.threshold = value;
  }

  getThreshold(): number {
    return this.threshold;
  }

  setMinInterval(ms: number): void {
    this.minStepInterval = ms;
  }
}
