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
    const engine = new AdvancedWorkoutEngine(plan);

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
    const engine = new AdvancedWorkoutEngine(plan);

    // Phase shift -PI/2 means:
    // At 0s: sin(-pi/2) = -1. Value = 1 + (5-1) * (0.5 * (-1 + 1)) = 1 (Start)
    engine.tick(0, 0, 5);
    expect(ftmsController.setSpeed).toHaveBeenCalledWith(8, 5);
    // Incline is delayed
    jest.advanceTimersByTime(600);
    expect(ftmsController.setIncline).toHaveBeenCalledWith(1);

    // At 15s (1/4 period): sin(0) = 0. Value = 1 + 4 * (0.5 * (0 + 1)) = 3 (Mid)
    engine.tick(15, 0, 5);
    // Speed is static, so only incline might be sent (but it's same as lastSentIncline if we didn't advance?)
    // Actually, calculateProfileValue for STATIC returns startValue. 
    // In this test, speed is static 8.
    
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
    const engine = new AdvancedWorkoutEngine(plan);

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
    const engine = new AdvancedWorkoutEngine(plan);

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
    const engine = new AdvancedWorkoutEngine(plan);

    engine.tick(0, 0, 10);
    jest.clearAllMocks();

    engine.resetLastSent();
    engine.tick(1, 0.002, 10);
    
    // Should re-send despite values being the same
    expect(ftmsController.setSpeed).toHaveBeenCalledWith(10, 10);
    
    jest.advanceTimersByTime(600);
    expect(ftmsController.setIncline).toHaveBeenCalledWith(2);
  });

  test('resetLastSent clears pending incline timeouts', () => {
    const step1: AtomicStep = {
      type: NodeType.STEP,
      id: 'step-1',
      name: 'Static Step',
      conditions: [{ type: ConditionType.TIME, value: 100 }],
      speedProfile: { mode: ProfileMode.STATIC, startValue: 10 },
      inclineProfile: { mode: ProfileMode.STATIC, startValue: 2 },
    };
    const plan = createMockPlan([step1]);
    const engine = new AdvancedWorkoutEngine(plan);

    engine.tick(0, 0, 10);
    expect(ftmsController.setIncline).not.toHaveBeenCalled();

    engine.resetLastSent();
    
    jest.advanceTimersByTime(600);
    // Should NOT have been called because it was cleared
    expect(ftmsController.setIncline).not.toHaveBeenCalled();
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
    const engine = new AdvancedWorkoutEngine(plan);

    // Neither met: 50s, 250m
    engine.tick(50, 250, 10);
    expect(engine.getProgress().currentIndex).toBe(0);

    // Distance met: 50s, 501m
    engine.tick(0, 251, 10);
    expect(engine.getProgress().currentIndex).toBe(1); // Finished
  });

  test('LINEAR profile correctly uses distance as primary goal', () => {
    const step1: AtomicStep = {
      type: NodeType.STEP,
      id: 'step-1',
      name: 'Distance Linear',
      conditions: [{ type: ConditionType.DISTANCE, value: 1000 }],
      speedProfile: { mode: ProfileMode.LINEAR, startValue: 4, targetValue: 8 },
      inclineProfile: { mode: ProfileMode.STATIC, startValue: 0 },
    };
    const plan = createMockPlan([step1]);
    const engine = new AdvancedWorkoutEngine(plan);

    // At 250m: (4 + (8-4) * (250/1000)) = 4 + 1 = 5
    engine.tick(30, 250, 5);
    expect(ftmsController.setSpeed).toHaveBeenCalledWith(5, 5);

    // At 750m: (4 + (8-4) * (750/1000)) = 4 + 3 = 7
    engine.tick(60, 500, 5);
    expect(ftmsController.setSpeed).toHaveBeenCalledWith(7, 5);
  });
});
