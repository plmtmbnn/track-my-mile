/**
 * Generic Moving Average implementation for smoothing noisy sensors.
 * Window size: 3-5 is recommended for fitness metrics.
 */
export class MovingAverage {
  private buffer: number[] = [];
  private readonly size: number;

  constructor(size: number = 5) {
    this.size = size;
  }

  public push(value: number): number {
    this.buffer.push(value);
    if (this.buffer.length > this.size) {
      this.buffer.shift();
    }
    return this.average();
  }

  public average(): number {
    if (this.buffer.length === 0) return 0;
    const sum = this.buffer.reduce((acc, val) => acc + val, 0);
    return sum / this.buffer.length;
  }

  public reset() {
    this.buffer = [];
  }
}
