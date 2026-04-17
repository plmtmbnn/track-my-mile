import { ftmsController } from '../FTMSController';
import {
  WorkoutPlan,
  AtomicStep,
  ConditionType,
  ProfileMode,
  MetricProfile,
  CompletionCondition,
} from './types';
import { WorkoutFlattener, ExecutionPointer } from './WorkoutFlattener';

/**
 * AdvancedWorkoutEngine orchestrates the execution of a workout plan.
 * It manages the transition between steps and calculates the target metrics
 * (speed/incline) based on the defined profiles.
 */
export class AdvancedWorkoutEngine {
  private queue: ExecutionPointer[] = [];
  private currentIndex: number = -1;
  private stepSeconds: number = 0;
  private stepDistance: number = 0;
  private onStepChange: (index: number) => void;

  // Track last sent values to reduce BLE traffic
  private lastSentSpeed: number | null = null;
  private lastSentIncline: number | null = null;
  private inclineTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(plan: WorkoutPlan, onStepChange: (index: number) => void) {
    this.queue = WorkoutFlattener.flatten(plan.root);
    this.onStepChange = onStepChange;
  }

  /**
   * Starts the workout from the given index or from the beginning.
   */
  public start(startIndex?: number): void {
    if (startIndex !== undefined && startIndex >= 0 && startIndex < this.queue.length) {
      this.currentIndex = startIndex;
    } else if (this.queue.length > 0) {
      this.currentIndex = 0;
    }

    this.stepSeconds = 0;
    this.stepDistance = 0;
    this.onStepChange(this.currentIndex);
  }

  /**
   * Resets the last sent values to force a re-sync on next tick.
   * Useful for pause/resume scenarios.
   */
  public resetLastSent(): void {
    this.lastSentSpeed = null;
    this.lastSentIncline = null;
    if (this.inclineTimeout) {
      clearTimeout(this.inclineTimeout);
      this.inclineTimeout = null;
    }
  }

  /**
   * Processes a single tick (typically 1Hz) of the workout.
   * Updates progress and sends commands to the FTMS controller if necessary.
   * 
   * @param deltaSeconds Time elapsed since last tick in seconds.
   * @param deltaDistance Distance traveled since last tick in meters.
   * @param currentSpeed Current speed of the machine in km/h.
   */
  public tick(deltaSeconds: number, deltaDistance: number, currentSpeed: number): void {
    if (this.currentIndex < 0 || this.currentIndex >= this.queue.length) {
      return;
    }

    const currentPointer = this.queue[this.currentIndex];
    const step = currentPointer.step;

    this.stepSeconds += deltaSeconds;
    this.stepDistance += deltaDistance;

    // Condition Check: Move to next step if ANY condition in step.conditions is met (OR logic)
    let conditionMet = false;
    for (const condition of step.conditions) {
      if (condition.type === ConditionType.TIME && this.stepSeconds >= condition.value) {
        conditionMet = true;
        break;
      }
      if (condition.type === ConditionType.DISTANCE && this.stepDistance >= condition.value) {
        conditionMet = true;
        break;
      }
      // ConditionType.MANUAL is handled by external calls to nextStep()
    }

    if (conditionMet) {
      this.nextStep(currentSpeed);
      return;
    }

    // Profile Calculation
    const targetSpeed = this.calculateProfileValue(
      step.speedProfile,
      this.stepSeconds,
      this.stepDistance,
      step.conditions
    );
    const targetIncline = this.calculateProfileValue(
      step.inclineProfile,
      this.stepSeconds,
      this.stepDistance,
      step.conditions
    );

    this.applyControls(targetSpeed, targetIncline, currentSpeed);
  }

  /**
   * Applies target speed and incline to the FTMS controller with throttling logic.
   */
  private applyControls(targetSpeed: number, targetIncline: number, currentSpeed: number): void {
    const speedChanged = targetSpeed !== this.lastSentSpeed;
    const inclineChanged = targetIncline !== this.lastSentIncline;

    if (!speedChanged && !inclineChanged) return;

    // FTMSController throttles at 500ms. If both change, delay incline.
    if (speedChanged && inclineChanged) {
      const oldSpeed = this.lastSentSpeed;
      this.lastSentSpeed = targetSpeed;
      ftmsController.setSpeed(targetSpeed, currentSpeed).catch(err => {
        console.error('[AdvancedWorkoutEngine] Speed update failed:', err);
        this.lastSentSpeed = oldSpeed;
      });

      // Clear any pending incline update
      if (this.inclineTimeout) clearTimeout(this.inclineTimeout);

      this.inclineTimeout = setTimeout(() => {
        const oldIncline = this.lastSentIncline;
        this.lastSentIncline = targetIncline;
        ftmsController.setIncline(targetIncline).catch(err => {
          console.error('[AdvancedWorkoutEngine] Delayed incline update failed:', err);
          this.lastSentIncline = oldIncline;
        });
        this.inclineTimeout = null;
      }, 600); // 600ms to clear 500ms throttle
    } else if (speedChanged) {
      const oldSpeed = this.lastSentSpeed;
      this.lastSentSpeed = targetSpeed;
      ftmsController.setSpeed(targetSpeed, currentSpeed).catch(err => {
        console.error('[AdvancedWorkoutEngine] Speed update failed:', err);
        this.lastSentSpeed = oldSpeed;
      });
    } else if (inclineChanged) {
      const oldIncline = this.lastSentIncline;
      this.lastSentIncline = targetIncline;
      ftmsController.setIncline(targetIncline).catch(err => {
        console.error('[AdvancedWorkoutEngine] Incline update failed:', err);
        this.lastSentIncline = oldIncline;
      });
    }
  }

  /**
   * Advances to the next step in the flattened workout queue.
   * 
   * @param currentSpeed Current speed to pass to FTMS controller for validation.
   */
  public nextStep(currentSpeed: number): void {
    if (this.currentIndex >= this.queue.length) return;

    this.currentIndex++;
    this.stepSeconds = 0;
    this.stepDistance = 0;
    this.resetLastSent();

    this.onStepChange(this.currentIndex);

    // If we have a new step, apply its initial values immediately
    if (this.currentIndex < this.queue.length) {
      const step = this.queue[this.currentIndex].step;
      const targetSpeed = this.calculateProfileValue(step.speedProfile, 0, 0, step.conditions);
      const targetIncline = this.calculateProfileValue(step.inclineProfile, 0, 0, step.conditions);

      this.applyControls(targetSpeed, targetIncline, currentSpeed);
    }
  }

  /**
   * Calculates the value for a metric based on its profile mode and current progress.
   */
  private calculateProfileValue(
    profile: MetricProfile,
    time: number,
    distance: number,
    conditions: CompletionCondition[]
  ): number {
    switch (profile.mode) {
      case ProfileMode.STATIC:
        return profile.startValue;

      case ProfileMode.LINEAR: {
        // Use the primary condition (first TIME or DISTANCE) to find totalGoal
        const primary = conditions.find(
          (c): c is { type: ConditionType.TIME | ConditionType.DISTANCE; value: number } =>
            c.type === ConditionType.TIME || c.type === ConditionType.DISTANCE
        );

        if (!primary) {
          return profile.startValue;
        }

        const progress = primary.type === ConditionType.TIME ? time : distance;
        const totalGoal = primary.value;

        if (totalGoal <= 0) return profile.targetValue;

        const ratio = Math.min(progress / totalGoal, 1);
        const rawValue = profile.startValue + (profile.targetValue - profile.startValue) * ratio;
        // Round to 2 decimal places to match FTMS resolution (0.01) and avoid floating point noise
        return Math.round(rawValue * 100) / 100;
      }

      case ProfileMode.OSCILLATE: {
        // OSCILLATE: startValue + (targetValue - startValue) * (0.5 * (Math.sin(2 * Math.PI * time / period - Math.PI / 2) + 1))
        // Fixed: Added - Math.PI / 2 phase shift to start at startValue (sin(-PI/2) = -1)
        const { startValue, targetValue, periodSeconds } = profile;
        if (periodSeconds <= 0) return startValue;

        const phase = (2 * Math.PI * time) / periodSeconds - Math.PI / 2;
        const sineComponent = 0.5 * (Math.sin(phase) + 1);
        const rawValue = startValue + (targetValue - startValue) * sineComponent;
        return Math.round(rawValue * 100) / 100;
      }

      default:
        return 0;
    }
  }

  /**
   * Returns the current step being executed.
   */
  public getCurrentStep(): AtomicStep | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.queue.length) return null;
    return this.queue[this.currentIndex].step;
  }

  /**
   * Returns the overall workout progress.
   */
  public getProgress() {
    return {
      currentIndex: this.currentIndex,
      totalSteps: this.queue.length,
      stepSeconds: this.stepSeconds,
      stepDistance: this.stepDistance,
      isFinished: this.currentIndex >= this.queue.length,
    };
  }
}
