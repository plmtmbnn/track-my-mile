import { ftmsController } from '../FTMSController';
import {
  WorkoutPlan,
  AtomicStep,
  ConditionType,
  ProfileMode,
  MetricProfile,
  CompletionCondition,
} from './types';
import { WorkoutFlattener, ExecutionPointer } from './ExecutionStack';

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

  constructor(plan: WorkoutPlan) {
    this.queue = WorkoutFlattener.flatten(plan.root);
    if (this.queue.length > 0) {
      this.currentIndex = 0;
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

    // Control: Call ftmsController.setSpeed and ftmsController.setIncline
    // We don't await here to keep the tick loop non-blocking
    ftmsController.setSpeed(targetSpeed, currentSpeed).catch(err =>
      console.error('[AdvancedWorkoutEngine] Failed to set speed:', err)
    );
    ftmsController.setIncline(targetIncline).catch(err =>
      console.error('[AdvancedWorkoutEngine] Failed to set incline:', err)
    );
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

    // If we have a new step, apply its initial values immediately
    if (this.currentIndex < this.queue.length) {
      const step = this.queue[this.currentIndex].step;
      const targetSpeed = this.calculateProfileValue(step.speedProfile, 0, 0, step.conditions);
      const targetIncline = this.calculateProfileValue(step.inclineProfile, 0, 0, step.conditions);

      ftmsController.setSpeed(targetSpeed, currentSpeed).catch(() => {});
      ftmsController.setIncline(targetIncline).catch(() => {});
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
        return profile.startValue + (profile.targetValue - profile.startValue) * ratio;
      }

      case ProfileMode.OSCILLATE: {
        // OSCILLATE: startValue + (targetValue - startValue) * (0.5 * (Math.sin(2 * Math.PI * time / period) + 1))
        const { startValue, targetValue, periodSeconds } = profile;
        if (periodSeconds <= 0) return startValue;

        const phase = (2 * Math.PI * time) / periodSeconds;
        const sineComponent = 0.5 * (Math.sin(phase) + 1);
        return startValue + (targetValue - startValue) * sineComponent;
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
