import { WorkoutConfig, WorkoutStep, EngineStatus, ControlMode } from './types';
import { ftmsController } from './FTMSController';
import { audioService } from '../experience/AudioService';
import { hapticService } from '../experience/HapticService';

/**
 * WorkoutEngine orchestrates structured sessions and optionally controls the treadmill.
 */
export class WorkoutEngine {
  private config: WorkoutConfig | null = null;
  private currentStepIndex: number = -1;
  private stepTimeRemaining: number = 0;
  private status: EngineStatus = EngineStatus.IDLE;
  private mode: ControlMode = ControlMode.MANUAL;

  private onStepChanged?: (step: WorkoutStep) => void;
  private onStatusChanged?: (status: EngineStatus) => void;

  public start(config: WorkoutConfig, mode: ControlMode = ControlMode.MANUAL) {
    this.config = config;
    this.mode = mode;
    this.currentStepIndex = 0;
    this.status = EngineStatus.ACTIVE;
    this.loadStep(0);
    this.onStatusChanged?.(this.status);
  }

  private loadStep(index: number) {
    if (!this.config || index >= this.config.steps.length) {
      this.completeWorkout();
      return;
    }

    this.currentStepIndex = index;
    const step = this.config.steps[index];
    this.stepTimeRemaining = step.duration;
    
    // Feedback
    audioService.speak(`Next step: ${step.name}. Target speed: ${step.targetSpeed} kilometers per hour.`, true);
    hapticService.triggerPhaseChange();

    // Auto Control Logic
    if (this.mode === ControlMode.AUTO) {
      this.syncTreadmillToStep(step);
    }

    this.onStepChanged?.(step);
  }

  private async syncTreadmillToStep(step: WorkoutStep) {
    // Current speed is needed for safety guard (jolting prevention).
    // In a real scenario, this would come from the live data stream (Phase 2).
    // For now, we assume a safe delta from 0 or last known.
    await ftmsController.setSpeed(step.targetSpeed, 0); 
    if (step.targetIncline !== undefined) {
      await ftmsController.setIncline(step.targetIncline);
    }
  }

  public update(deltaTime: number) {
    if (this.status !== EngineStatus.ACTIVE) return;

    this.stepTimeRemaining -= deltaTime;

    if (this.stepTimeRemaining <= 0) {
      this.loadStep(this.currentStepIndex + 1);
    }
  }

  public pause() {
    this.status = EngineStatus.PAUSED;
    this.onStatusChanged?.(this.status);
    if (this.mode === ControlMode.AUTO) {
      ftmsController.stop();
    }
  }

  public resume() {
    this.status = EngineStatus.ACTIVE;
    this.onStatusChanged?.(this.status);
    if (this.mode === ControlMode.AUTO && this.config) {
      this.syncTreadmillToStep(this.config.steps[this.currentStepIndex]);
    }
  }

  private completeWorkout() {
    this.status = EngineStatus.COMPLETED;
    this.onStatusChanged?.(this.status);
    audioService.speak('Workout completed! Well done.', true);
    if (this.mode === ControlMode.AUTO) {
      ftmsController.stop();
    }
  }

  public setMode(mode: ControlMode) {
    this.mode = mode;
  }

  public getStatus() {
    return {
      status: this.status,
      currentStep: this.config?.steps[this.currentStepIndex],
      timeRemaining: this.stepTimeRemaining,
      mode: this.mode,
    };
  }
}

export const workoutEngine = new WorkoutEngine();
