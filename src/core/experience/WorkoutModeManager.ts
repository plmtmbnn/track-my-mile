import { WorkoutMode, IntervalPhase, WorkoutPhaseDetail } from './types';
import { audioService } from './AudioService';
import { hapticService } from './HapticService';

export interface IntervalConfig {
  warmupSeconds: number;
  workSeconds: number;
  restSeconds: number;
  repeats: number;
  cooldownSeconds: number;
}

/**
 * Manages structured workout logic and transitions.
 */
export class WorkoutModeManager {
  private mode: WorkoutMode = WorkoutMode.FREE_RUN;
  private currentPhase: IntervalPhase = IntervalPhase.WARMUP;
  private phaseTimeRemaining: number = 0;
  private currentRepeat: number = 0;
  private config?: IntervalConfig;

  public setMode(mode: WorkoutMode, config?: IntervalConfig) {
    this.mode = mode;
    this.config = config;
    this.currentRepeat = 0;
    
    if (mode === WorkoutMode.INTERVAL && config) {
      this.currentPhase = IntervalPhase.WARMUP;
      this.phaseTimeRemaining = config.warmupSeconds;
    }
  }

  public update(deltaTime: number): WorkoutPhaseDetail {
    if (this.mode === WorkoutMode.FREE_RUN) {
      return { mode: this.mode };
    }

    if (this.phaseTimeRemaining > 0) {
      this.phaseTimeRemaining -= deltaTime;
    }

    if (this.phaseTimeRemaining <= 0) {
      this.transitionToNextPhase();
    }

    return {
      mode: this.mode,
      currentPhase: this.currentPhase,
      timeRemainingInPhase: Math.max(0, this.phaseTimeRemaining),
    };
  }

  private transitionToNextPhase() {
    if (!this.config) return;

    switch (this.currentPhase) {
      case IntervalPhase.WARMUP:
        this.currentPhase = IntervalPhase.WORK;
        this.phaseTimeRemaining = this.config.workSeconds;
        audioService.speak('Interval starting. Work hard!', true);
        break;
      case IntervalPhase.WORK:
        this.currentPhase = IntervalPhase.REST;
        this.phaseTimeRemaining = this.config.restSeconds;
        audioService.speak('Interval finished. Rest period.', true);
        break;
      case IntervalPhase.REST:
        this.currentRepeat++;
        if (this.currentRepeat < this.config.repeats) {
          this.currentPhase = IntervalPhase.WORK;
          this.phaseTimeRemaining = this.config.workSeconds;
          audioService.speak(`Interval ${this.currentRepeat + 1}. Go!`, true);
        } else {
          this.currentPhase = IntervalPhase.COOLDOWN;
          this.phaseTimeRemaining = this.config.cooldownSeconds;
          audioService.speak('Intervals complete. Start cooldown.', true);
        }
        break;
      case IntervalPhase.COOLDOWN:
        // Workout finished, but we stay in cooldown or IDLE
        break;
    }

    hapticService.triggerPhaseChange();
  }
}
