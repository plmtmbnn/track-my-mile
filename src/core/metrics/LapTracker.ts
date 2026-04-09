import { Lap } from './types';

/**
 * Automatically creates splits (laps) every 1km.
 * Tracks performance per lap for meaningful workout analysis.
 */
export class LapTracker {
  private laps: Lap[] = [];
  private currentLapDistance: number = 0;
  private currentLapDuration: number = 0;
  private lapDistanceThreshold: number = 1000; // 1km in meters
  
  private lapSpeeds: number[] = [];

  /**
   * Updates lap progress and returns the completed lap if a threshold was met.
   */
  public update(deltaDistance: number, deltaTime: number, currentSpeed: number, totalTime: number): Lap | null {
    if (deltaDistance <= 0 && deltaTime <= 0) return null;

    this.currentLapDistance += deltaDistance;
    this.currentLapDuration += deltaTime;
    this.lapSpeeds.push(currentSpeed);

    if (this.currentLapDistance >= this.lapDistanceThreshold) {
      const avgSpeed = this.lapSpeeds.length > 0 
        ? this.lapSpeeds.reduce((a, b) => a + b, 0) / this.lapSpeeds.length 
        : currentSpeed;
      
      const newLap: Lap = {
        lapNumber: this.laps.length + 1,
        startTime: totalTime - this.currentLapDuration,
        endTime: totalTime,
        distance: this.currentLapDistance,
        duration: this.currentLapDuration,
        avgSpeed: parseFloat(avgSpeed.toFixed(2)),
        avgPace: avgSpeed > 0 ? parseFloat((60 / avgSpeed).toFixed(2)) : 0,
      };

      this.laps.push(newLap);
      this.resetLap();
      return newLap;
    }

    return null;
  }

  private resetLap() {
    this.currentLapDistance = 0;
    this.currentLapDuration = 0;
    this.lapSpeeds = [];
  }

  public getLaps(): Lap[] {
    return this.laps;
  }

  public reset() {
    this.laps = [];
    this.resetLap();
  }
}
