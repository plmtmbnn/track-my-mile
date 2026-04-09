import { TreadmillMetrics } from '../types';
import { TreadmillData, parseFTMSTreadmillData } from '../../utils/FTMSParser';

export class DataProcessor {
  private lastMetrics: TreadmillMetrics = {
    speed: 0,
    incline: 0,
    distance: 0,
    duration: 0,
    calories: 0,
    heartRate: 0,
    power: 0,
  };

  /**
   * Processes raw BLE characteristic value (Base64) into stable TreadmillMetrics.
   * Ensures data integrity by:
   * 1. Handling undefined fields
   * 2. Preventing negative values
   * 3. Ensuring time/distance are monotonically increasing
   */
  public processRawData(base64: string): TreadmillMetrics {
    const raw = parseFTMSTreadmillData(base64);

    const speed = Math.max(0, raw.speed ?? 0);
    const incline = raw.incline ?? 0;
    
    // Distance/Time should ideally be monotonically increasing.
    // However, some treadmills might reset these during a session if they have their own logic.
    // We treat the current app session as the source of truth for accumulated distance.
    const distance = Math.max(this.lastMetrics.distance, raw.totalDistance ?? 0);
    const duration = Math.max(this.lastMetrics.duration, raw.elapsedTime ?? 0);
    
    const calories = Math.max(0, raw.totalEnergy ?? 0);
    const heartRate = Math.max(0, raw.heartRate ?? 0);
    const power = Math.max(0, raw.powerOutput ?? 0);

    const processed: TreadmillMetrics = {
      speed,
      incline,
      distance,
      duration,
      calories,
      heartRate,
      power,
    };

    this.lastMetrics = processed;
    return processed;
  }

  public reset() {
    this.lastMetrics = {
      speed: 0,
      incline: 0,
      distance: 0,
      duration: 0,
      calories: 0,
      heartRate: 0,
      power: 0,
    };
  }
}
