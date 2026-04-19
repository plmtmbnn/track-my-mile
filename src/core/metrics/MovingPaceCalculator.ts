/**
 * MovingPaceCalculator uses a rolling window to stabilize pace metrics.
 * Prevents instant fluctuations caused by small distance delta noise.
 */
export class MovingPaceCalculator {
  private windowSize: number = 10; // 10 second window
  private samples: { distance: number; timestamp: number }[] = [];

  /**
   * Adds a new distance point and returns the smoothed pace in min/km.
   */
  public calculatePace(currentDistanceMeters: number): number {
    const now = Date.now();
    this.samples.push({ distance: currentDistanceMeters, timestamp: now });

    // Maintain window
    if (this.samples.length > this.windowSize) {
      this.samples.shift();
    }

    if (this.samples.length < 2) return 0;

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];

    const distanceDeltaKm = (last.distance - first.distance) / 1000;
    const timeDeltaMin = (last.timestamp - first.timestamp) / 1000 / 60;

    if (distanceDeltaKm <= 0 || timeDeltaMin <= 0) return 0;

    const pace = timeDeltaMin / distanceDeltaKm;
    
    // Sanity check: no one runs faster than 2 min/km or slower than 20 min/km (walking)
    if (pace < 2) return 2;
    if (pace > 25) return 0;

    return parseFloat(pace.toFixed(2));
  }

  public reset() {
    this.samples = [];
  }
}
