import { WorkoutState } from './types';

type WorkoutTransition = {
  [K in WorkoutState]?: WorkoutState[];
};

export class WorkoutStateMachine {
  private currentState: WorkoutState = WorkoutState.IDLE;
  private onStateChange?: (state: WorkoutState) => void;

  private static readonly VALID_TRANSITIONS: WorkoutTransition = {
    [WorkoutState.IDLE]: [WorkoutState.RUNNING],
    [WorkoutState.RUNNING]: [WorkoutState.PAUSED, WorkoutState.STOPPED],
    [WorkoutState.PAUSED]: [WorkoutState.RUNNING, WorkoutState.STOPPED],
    [WorkoutState.STOPPED]: [WorkoutState.SAVED, WorkoutState.IDLE],
    [WorkoutState.SAVED]: [WorkoutState.IDLE],
  };

  constructor(initialState: WorkoutState = WorkoutState.IDLE, onStateChange?: (state: WorkoutState) => void) {
    this.currentState = initialState;
    this.onStateChange = onStateChange;
  }

  public getState(): WorkoutState {
    return this.currentState;
  }

  public transition(nextState: WorkoutState): boolean {
    const allowed = WorkoutStateMachine.VALID_TRANSITIONS[this.currentState];
    
    if (allowed?.includes(nextState)) {
      console.log(`[WorkoutStateMachine] Transition: ${this.currentState} -> ${nextState}`);
      this.currentState = nextState;
      this.onStateChange?.(nextState);
      return true;
    }

    console.warn(`[WorkoutStateMachine] Invalid transition: ${this.currentState} -> ${nextState}`);
    return false;
  }

  // Edge case: Force resume after app kill if we were in RUNNING or PAUSED
  public restoreState(state: WorkoutState) {
    this.currentState = state;
    this.onStateChange?.(state);
  }
}
