import { AdvancedWorkoutEngine } from './AdvancedWorkoutEngine';
import { WorkoutPlan, NodeType, ConditionType, ProfileMode, AtomicStep, GroupNode } from './types';
import { ftmsController } from '../FTMSController';

// Mock the FTMS controller
jest.mock('../FTMSController', () => ({
  ftmsController: {
    setSpeed: jest.fn().mockResolvedValue(undefined),
    setIncline: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('AdvancedWorkoutEngine', () => {
  const createMockPlan = (steps: AtomicStep[]): WorkoutPlan => ({
    id: 'plan-1',
    name: 'Test Plan',
    root: {
      type: NodeType.GROUP,
      id: 'root',
      name: 'Root',
      repeatCount: 1,
      children: steps,
    } as GroupNode,
  });

  const onStepChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('LINEAR profile speed calculation correctly interpolates', async () => {
    const step1: AtomicStep = {
      type: NodeType.STEP,
      id: 'step-1',
      name: 'Linear Warmup',
      conditions: [{ type: ConditionType.TIME, value: 100 }],
      speedProfile: { mode: ProfileMode.LINEAR, startValue: 5, targetValue: 10 },
      inclineProfile: { mode: ProfileMode.STATIC, startValue: 1 },
    };
    const plan = createMockPlan([step1]);
    const engine = new AdvancedWorkoutEngine(plan, onStepChange);
    engine.start();

    // Starting speed at 0s: (5 + (10-5) * (0/100)) = 5
    engine.tick(0, 0, 5);
    expect(ftmsController.setSpeed).toHaveBeenCalledWith(5, 5);

    // Speed at 50s: (5 + (10-5) * (50/100)) = 7.5
    engine.tick(50, 0, 5);
    expect(ftmsController.setSpeed).toHaveBeenCalledWith(7.5, 5);

    // Speed at 75s (cumulative): (5 + (10-5) * (75/100)) = 8.75
    engine.tick(25, 0, 5);
    expect(ftmsController.setSpeed).toHaveBeenCalledWith(8.75, 5);
  });

  test('OSCILLATE profile calculation follows sine wave starting at startValue', () => {
    const step1: AtomicStep = {
      type: NodeType.STEP,
      id: 'step-1',
      name: 'Hills',
      conditions: [{ type: ConditionType.TIME, value: 120 }],
      speedProfile: { mode: ProfileMode.STATIC, startValue: 8 },
      inclineProfile: { 
        mode: ProfileMode.OSCILLATE, 
        startValue: 1, 
        targetValue: 5, 
        periodSeconds: 60 
      },
    };
    const plan = createMockPlan([step1]);
    const engine = new AdvancedWorkoutEngine(plan, onStepChange);
    engine.start();

    // Phase shift -PI/2 means:
    // At 0s: sin(-pi/2) = -1. Value = 1 + (5-1) * (0.5 * (-1 + 1)) = 1 (Start)
    engine.tick(0, 0, 5);
    expect(ftmsController.setSpeed).toHaveBeenCalledWith(8, 5);
    // Incline is delayed
    jest.advanceTimersByTime(600);
    expect(ftmsController.setIncline).toHaveBeenCalledWith(1);

    // At 15s (1/4 period): sin(0) = 0. Value = 1 + 4 * (0.5 * (0 + 1)) = 3 (Mid)
    engine.tick(15, 0, 5);
    
    jest.advanceTimersByTime(600);
    expect(ftmsController.setIncline).toHaveBeenCalledWith(3);

    // At 30s (1/2 period): sin(pi/2) = 1. Value = 1 + 4 * (0.5 * (1 + 1)) = 5 (Max)
    engine.tick(15, 0, 5);
    jest.advanceTimersByTime(600);
    expect(ftmsController.setIncline).toHaveBeenCalledWith(5);

    // At 45s (3/4 period): sin(pi) = 0. Value = 1 + 4 * (0.5 * (0 + 1)) = 3 (Mid)
    engine.tick(15, 0, 5);
    jest.advanceTimersByTime(600);
    expect(ftmsController.setIncline).toHaveBeenCalledWith(3);

    // At 60s (full period): sin(3pi/2) = -1. Value = 1 + 4 * (0.5 * (-1 + 1)) = 1 (Min)
    engine.tick(15, 0, 5);
    jest.advanceTimersByTime(600);
    expect(ftmsController.setIncline).toHaveBeenCalledWith(1);
  });

  test('Reduces BLE traffic by not sending duplicate values', () => {
    const step1: AtomicStep = {
      type: NodeType.STEP,
      id: 'step-1',
      name: 'Static Step',
      conditions: [{ type: ConditionType.TIME, value: 100 }],
      speedProfile: { mode: ProfileMode.STATIC, startValue: 10 },
      inclineProfile: { mode: ProfileMode.STATIC, startValue: 2 },
    };
    const plan = createMockPlan([step1]);
    const engine = new AdvancedWorkoutEngine(plan, onStepChange);
    engine.start();

    // First tick sends values
    engine.tick(0, 0, 10);
    expect(ftmsController.setSpeed).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(600);
    expect(ftmsController.setIncline).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    // Second tick with same values should NOT send
    engine.tick(1, 0.002, 10);
    expect(ftmsController.setSpeed).not.toHaveBeenCalled();
    expect(ftmsController.setIncline).not.toHaveBeenCalled();
  });

  test('Throttles simultaneous speed and incline changes', () => {
    const step1: AtomicStep = {
      type: NodeType.STEP,
      id: 'step-1',
      name: 'Linear Step',
      conditions: [{ type: ConditionType.TIME, value: 100 }],
      speedProfile: { mode: ProfileMode.LINEAR, startValue: 5, targetValue: 10 },
      inclineProfile: { mode: ProfileMode.LINEAR, startValue: 0, targetValue: 5 },
    };
    const plan = createMockPlan([step1]);
    const engine = new AdvancedWorkoutEngine(plan, onStepChange);
    engine.start();

    // Tick 0: both change from null
    engine.tick(0, 0, 5);
    
    // Speed should be sent immediately
    expect(ftmsController.setSpeed).toHaveBeenCalledWith(5, 5);
    // Incline should NOT be sent immediately (it's in a timeout)
    expect(ftmsController.setIncline).not.toHaveBeenCalled();

    // Fast-forward 600ms
    jest.advanceTimersByTime(600);
    expect(ftmsController.setIncline).toHaveBeenCalledWith(0);
  });

  test('resetLastSent forces a re-sync', () => {
    const step1: AtomicStep = {
      type: NodeType.STEP,
      id: 'step-1',
      name: 'Static Step',
      conditions: [{ type: ConditionType.TIME, value: 100 }],
      speedProfile: { mode: ProfileMode.STATIC, startValue: 10 },
      inclineProfile: { mode: ProfileMode.STATIC, startValue: 2 },
    };
    const plan = createMockPlan([step1]);
    const engine = new AdvancedWorkoutEngine(plan, onStepChange);
    engine.start();

    engine.tick(0, 0, 10);
    jest.clearAllMocks();

    engine.resetLastSent();
    engine.tick(1, 0.002, 10);
    
    // Should re-send despite values being the same
    expect(ftmsController.setSpeed).toHaveBeenCalledWith(10, 10);
    
    jest.advanceTimersByTime(600);
    expect(ftmsController.setIncline).toHaveBeenCalledWith(2);
  });

  test('OR logic for step transition conditions', () => {
    const step1: AtomicStep = {
      type: NodeType.STEP,
      id: 'step-1',
      name: 'Two-Way Step',
      conditions: [
        { type: ConditionType.TIME, value: 100 },
        { type: ConditionType.DISTANCE, value: 500 },
      ],
      speedProfile: { mode: ProfileMode.STATIC, startValue: 10 },
      inclineProfile: { mode: ProfileMode.STATIC, startValue: 0 },
    };
    const plan = createMockPlan([step1]);
    const engine = new AdvancedWorkoutEngine(plan, onStepChange);
    engine.start();

    // Neither met: 50s, 250m
    engine.tick(50, 250, 10);
    expect(engine.getProgress().currentIndex).toBe(0);

    // Distance met: 50s, 501m
    engine.tick(0, 251, 10);
    expect(engine.getProgress().currentIndex).toBe(1); // Finished
  });

  test('can start from a specific index', () => {
    const step1: AtomicStep = {
      type: NodeType.STEP,
      id: 'step-1',
      name: 'Step 1',
      conditions: [{ type: ConditionType.TIME, value: 100 }],
      speedProfile: { mode: ProfileMode.STATIC, startValue: 5 },
      inclineProfile: { mode: ProfileMode.STATIC, startValue: 0 },
    };
    const step2: AtomicStep = {
      type: NodeType.STEP,
      id: 'step-2',
      name: 'Step 2',
      conditions: [{ type: ConditionType.TIME, value: 100 }],
      speedProfile: { mode: ProfileMode.STATIC, startValue: 10 },
      inclineProfile: { mode: ProfileMode.STATIC, startValue: 0 },
    };
    const plan = createMockPlan([step1, step2]);
    const engine = new AdvancedWorkoutEngine(plan, onStepChange);
    
    engine.start(1);
    expect(engine.getProgress().currentIndex).toBe(1);
    expect(onStepChange).toHaveBeenCalledWith(1);
  });
});
