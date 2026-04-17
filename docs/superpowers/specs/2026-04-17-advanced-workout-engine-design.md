# Design Spec: Advanced Workout Engine

## 1. Overview
The Advanced Workout Engine is a scalable, node-based system for the TrackMyMile application. It enables the creation and execution of complex, multi-step workout plans ranging from simple distance goals to professional-grade interval blocks, progression runs, and dynamic hill simulations.

## 2. Goals
- **Complexity:** Support deeply nested intervals (groups within groups).
- **Flexibility:** Allow "first-to-finish" completion conditions (e.g., 5KM or 30 Minutes).
- **Scalability:** Handle elite training modes like Progression Runs and Dynamic Rolling Hills via Metric Profiles.
- **Accuracy:** Integrate with existing DataProcessor for monotonic distance and time tracking.

## 3. Data Architecture (TypeScript)

### 3.1 Nodes & Structure
The workout is defined as a recursive tree of nodes.

```typescript
export enum NodeType {
  STEP = 'STEP',
  GROUP = 'GROUP',
}

export enum ConditionType {
  TIME = 'TIME',         // Unit: Seconds
  DISTANCE = 'DISTANCE', // Unit: Meters
  MANUAL = 'MANUAL',     // Unit: User interaction
}

export enum ProfileMode {
  STATIC = 'STATIC',     // Steady speed/incline
  LINEAR = 'LINEAR',     // Gradual change (Progression)
  OSCILLATE = 'OSCILLATE' // Wave pattern (Rolling Hills)
}

export interface MetricProfile {
  mode: ProfileMode;
  startValue: number;
  targetValue?: number;  // Used for LINEAR
  periodSeconds?: number; // Used for OSCILLATE
}

export interface CompletionCondition {
  type: ConditionType;
  value?: number;
}

export interface AtomicStep {
  type: NodeType.STEP;
  id: string;
  name: string;
  conditions: CompletionCondition[]; 
  speedProfile: MetricProfile;
  inclineProfile: MetricProfile;
  notes?: string;
}

export interface GroupNode {
  type: NodeType.GROUP;
  id: string;
  name: string;
  repeatCount: number;
  children: WorkoutNode[];
}

export type WorkoutNode = AtomicStep | GroupNode;

export interface WorkoutPlan {
  id: string;
  name: string;
  root: GroupNode;
}
```

## 4. Engine Logic (Execution Stack)

### 4.1 Initialization (Flattening)
Upon starting a workout, the engine generates an **Execution Stack**. This stack is an array of "Execution Pointers" that reference specific steps and their current repeat iteration.

### 4.2 Tick Processing (1Hz)
The engine processes a "Tick" every second, consuming data from the `DataProcessor`.

- **Progress Tracking:** Updates cumulative time and distance *relative to the current step*.
- **Condition Check:** Evaluates `conditions[]`. If ANY condition is met (OR logic), the engine moves to the next node.
- **Profile Calculation:**
  - **LINEAR:** `startValue + (targetValue - startValue) * (stepProgress / totalGoal)`
  - **OSCILLATE:** Uses a Sine wave logic: `min + (max - min) * (0.5 * (Math.sin(2 * Math.PI * time / period) + 1))`

## 5. System Integration

- **Input:** Subscribes to `ProcessedData` from the Phase 2 `DataProcessor`.
- **Output:** Emits commands to Phase 4 `SafetyGuard` -> `FTMSController`.
- **Feedback:** Triggers `AudioController` (Phase 6) on step transitions and interval starts.
- **State:** Managed via a new `useAdvancedWorkoutStore` to preserve state across app reloads.

## 6. UI Interaction
- **Progress Signal:** Exposes overall workout % and current step %.
- **Preview:** Provides metadata for the "Next Step" to keep the runner informed.

## 7. Self-Review Notes
- **Ambiguity Check:** Condition values are explicitly typed (Seconds for Time, Meters for Distance).
- **Consistency:** The system reuses existing Enums where possible but extends targets to "Profiles" for future-proofing.
- **Scope:** This spec covers the Logic and Data layers; the "Workout Builder" UI will be handled in the implementation plan.
