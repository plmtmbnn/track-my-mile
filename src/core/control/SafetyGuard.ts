import { ControlLimits } from './types';

/**
 * SafetyGuard ensures the app never sends unsafe or out-of-range commands.
 */
export class SafetyGuard {
  private limits: ControlLimits = {
    maxSpeed: 20.0,
    minSpeed: 0.8,
    maxIncline: 15.0,
    minIncline: 0.0,
    maxSpeedChangePerStep: 2.0, // Limit delta to avoid jolts
  };

  public validateSpeed(target: number, current: number): number {
    let validated = Math.max(this.limits.minSpeed, Math.min(this.limits.maxSpeed, target));
    
    // Prevent sudden speed jumps
    const delta = validated - current;
    if (Math.abs(delta) > this.limits.maxSpeedChangePerStep) {
      validated = current + (delta > 0 ? this.limits.maxSpeedChangePerStep : -this.limits.maxSpeedChangePerStep);
    }

    return parseFloat(validated.toFixed(1));
  }

  public validateIncline(target: number): number {
    const validated = Math.max(this.limits.minIncline, Math.min(this.limits.maxIncline, target));
    return parseFloat(validated.toFixed(1));
  }

  public setLimits(newLimits: Partial<ControlLimits>) {
    this.limits = { ...this.limits, ...newLimits };
  }
}

export const safetyGuard = new SafetyGuard();
