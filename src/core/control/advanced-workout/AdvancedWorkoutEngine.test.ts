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

  test('OSCILLATE profile calculation follows sine wave', () => {
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

    // At 0s, sin(0) = 0, value = 1 + (5-1) * (0.5 * (0 + 1)) = 1 + 2 = 3
    engine.tick(0, 0, 5);
    expect(ftmsController.setIncline).toHaveBeenCalledWith(3);

    // At 15s (1/4 period), sin(pi/2) = 1, value = 1 + 4 * (0.5 * (1 + 1)) = 5 (Max)
    engine.tick(15, 0, 5);
    expect(ftmsController.setIncline).toHaveBeenCalledWith(5);

    // At 30s (1/2 period), sin(pi) = 0, value = 1 + 4 * (0.5 * (0 + 1)) = 3 (Mid)
    engine.tick(15, 0, 5);
    expect(ftmsController.setIncline).toHaveBeenCalledWith(3);

    // At 45s (3/4 period), sin(3pi/2) = -1, value = 1 + 4 * (0.5 * (-1 + 1)) = 1 (Min)
    engine.tick(15, 0, 5);
    expect(ftmsController.setIncline).toHaveBeenCalledWith(1);
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
