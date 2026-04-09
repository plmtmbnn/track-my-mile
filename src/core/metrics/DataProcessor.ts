import { RawData, ProcessedData, TrackPoint, Lap } from './types';
import { MovingAverage } from './MovingAverage';
import { LapTracker } from './LapTracker';

/**
 * DataProcessor orchestrates the transformation of raw BLE signals into
 * fitness-grade metrics.
 */
export class DataProcessor {
  // Smoothing window (3-5 samples)
  private speedSmoother = new MovingAverage(5);
  private inclineSmoother = new MovingAverage(3);
  
  private lapTracker = new LapTracker();
  
  // State for monotonic validation
  private lastRaw: RawData | null = null;
  private totalDistance: number = 0; // Cumulative validated distance (meters)
  private totalCalories: number = 0; // Cumulative calories (kcal)
  
  // User profile for calorie estimation (should be configurable)
  private userWeightKg: number = 70;
  private readonly calorieFactor = 1.036; // Typical kcal/kg/km

  // High-precision spike detection
  private readonly maxSpeedChangeKmH = 2.5; // Max allowed change between updates (1s freq)

  /**
   * Main entry point for the data pipeline.
   */
  public process(raw: RawData): ProcessedData {
    // 1. Validation Layer (Ignore corrupted or negative data)
    if (raw.speed < 0 || raw.distance < 0) {
      return this.getLastProcessedOrDefault(raw.timestamp);
    }

    // 2. Spike Filtering (Anomaly Detection)
    let validatedSpeed = raw.speed;
    let isSpike = false;
    
    if (this.lastRaw) {
      const speedDiff = Math.abs(raw.speed - this.lastRaw.speed);
      if (speedDiff > this.maxSpeedChangeKmH) {
        // Detected a spike, use last known good speed
        validatedSpeed = this.lastRaw.speed;
        isSpike = true;
      }
    }

    // 3. Smoothing (Apply Moving Average)
    const smoothedSpeed = this.speedSmoother.push(validatedSpeed);
    const smoothedIncline = this.inclineSmoother.push(raw.incline);

    // 4. Distance Integrity (Monotonic check)
    // If treadmill resets distance mid-session, we handle the delta.
    let deltaDistance = 0;
    if (this.lastRaw) {
      if (raw.distance >= this.lastRaw.distance) {
        deltaDistance = raw.distance - this.lastRaw.distance;
      } else {
        // Treadmill distance reset detected, treat current as start of new delta
        deltaDistance = raw.distance;
      }
    } else {
      deltaDistance = raw.distance;
    }
    this.totalDistance += deltaDistance;

    // 5. Derived Metrics
    // Pace: min/km = 60 / speed(km/h)
    const pace = smoothedSpeed > 0 ? 60 / smoothedSpeed : 0;
    
    // Calorie estimation: Weight(kg) * Distance(km) * Factor
    const deltaKm = deltaDistance / 1000;
    const deltaCals = this.userWeightKg * deltaKm * this.calorieFactor;
    this.totalCalories += deltaCals;

    // 6. Lap Management
    const deltaTime = this.lastRaw ? (raw.elapsedTime - this.lastRaw.elapsedTime) : raw.elapsedTime;
    this.lapTracker.update(deltaDistance, Math.max(0, deltaTime), smoothedSpeed, raw.elapsedTime);

    // Update state for next cycle
    this.lastRaw = raw;

    return {
      speed: parseFloat(smoothedSpeed.toFixed(2)),
      pace: parseFloat(pace.toFixed(2)),
      distance: Math.round(this.totalDistance),
      duration: raw.elapsedTime,
      incline: parseFloat(smoothedIncline.toFixed(2)),
      calories: Math.round(this.totalCalories),
      heartRate: raw.heartRate || 0,
      isSpike,
      timestamp: raw.timestamp
    };
  }

  private getLastProcessedOrDefault(timestamp: number): ProcessedData {
    return {
      speed: this.speedSmoother.average(),
      pace: 0,
      distance: this.totalDistance,
      duration: this.lastRaw?.elapsedTime || 0,
      incline: this.inclineSmoother.average(),
      calories: this.totalCalories,
      heartRate: 0,
      isSpike: false,
      timestamp
    };
  }

  public getTrackPoint(processed: ProcessedData): TrackPoint {
    return {
      timestamp: processed.timestamp,
      speed: processed.speed,
      pace: processed.pace,
      distance: processed.distance,
      incline: processed.incline,
      heartRate: processed.heartRate
    };
  }

  public getLaps(): Lap[] {
    return this.lapTracker.getLaps();
  }

  public reset(weightKg: number = 70) {
    this.speedSmoother.reset();
    this.inclineSmoother.reset();
    this.lapTracker.reset();
    this.lastRaw = null;
    this.totalDistance = 0;
    this.totalCalories = 0;
    this.userWeightKg = weightKg;
  }
}
