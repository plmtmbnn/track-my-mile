/**
 * NodeType defines the structural role of a node in the workout tree.
 */
export enum NodeType {
  STEP = 'STEP',
  GROUP = 'GROUP',
}

/**
 * ConditionType defines how a step's completion is measured.
 */
export enum ConditionType {
  TIME = 'TIME',         // Unit: Seconds
  DISTANCE = 'DISTANCE', // Unit: Meters
  MANUAL = 'MANUAL',     // Unit: User interaction
}

/**
 * ProfileMode defines the behavior of a metric (speed/incline) during a step.
 */
export enum ProfileMode {
  STATIC = 'STATIC',     // Steady speed/incline
  LINEAR = 'LINEAR',     // Gradual change (Progression)
  OSCILLATE = 'OSCILLATE' // Wave pattern (Rolling Hills)
}

/**
 * MetricProfile defines the target values and progression for a metric.
 */
export type MetricProfile =
  | { mode: ProfileMode.STATIC; startValue: number }
  | { mode: ProfileMode.LINEAR; startValue: number; targetValue: number }
  | { mode: ProfileMode.OSCILLATE; startValue: number; targetValue: number; periodSeconds: number };

/**
 * CompletionCondition defines a single trigger that can end a step.
 */
export type CompletionCondition =
  | { type: ConditionType.TIME; value: number }
  | { type: ConditionType.DISTANCE; value: number }
  | { type: ConditionType.MANUAL };

/**
 * AtomicStep is a leaf node representing an actual workout interval.
 */
export interface AtomicStep {
  type: NodeType.STEP;
  id: string;
  name: string;
  conditions: CompletionCondition[];
  speedProfile: MetricProfile;
  inclineProfile: MetricProfile;
  notes?: string;
}

/**
 * GroupNode is a container node that can repeat its children.
 */
export interface GroupNode {
  type: NodeType.GROUP;
  id: string;
  name: string;
  repeatCount: number;
  children: WorkoutNode[];
}

/**
 * WorkoutNode represents any element in the workout tree.
 */
export type WorkoutNode = AtomicStep | GroupNode;

/**
 * WorkoutPlan is the top-level definition of an advanced workout.
 */
export interface WorkoutPlan {
  id: string;
  name: string;
  root: GroupNode;
}
