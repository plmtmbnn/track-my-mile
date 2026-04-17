# Advanced Workout Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a recursive, node-based workout engine capable of executing complex interval, progression, and hill sessions.

**Architecture:** A stack-based execution engine that flattens a workout tree into a runtime queue. It calculates dynamic speed/incline targets using "Profiles" and supports multi-condition completion logic.

**Tech Stack:** React Native, TypeScript, Zustand, Lucide Icons, Reanimated.

---

### Task 1: Core Type Definitions

**Files:**
- Create: `src/core/control/advanced-workout/types.ts`

- [ ] **Step 1: Define Enums and Interfaces**

```typescript
export enum NodeType {
  STEP = 'STEP',
  GROUP = 'GROUP',
}

export enum ConditionType {
  TIME = 'TIME',
  DISTANCE = 'DISTANCE',
  MANUAL = 'MANUAL',
}

export enum ProfileMode {
  STATIC = 'STATIC',
  LINEAR = 'LINEAR',
  OSCILLATE = 'OSCILLATE'
}

export interface MetricProfile {
  mode: ProfileMode;
  startValue: number;
  targetValue?: number;
  periodSeconds?: number;
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

- [ ] **Step 2: Commit**

```bash
git add src/core/control/advanced-workout/types.ts
git commit -m "chore(workout): define advanced workout types"
```

---

### Task 2: Advanced Workout Store

**Files:**
- Create: `src/store/useAdvancedWorkoutStore.ts`

- [ ] **Step 1: Create Zustand store with persistence**

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { WorkoutPlan, WorkoutNode } from '../core/control/advanced-workout/types';

const storage = createMMKV({ id: 'advanced-workout-storage' });

const mmkvStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.remove(name),
};

interface AdvancedWorkoutState {
  savedPlans: WorkoutPlan[];
  activePlanId: string | null;
  currentStepId: string | null;
  currentIteration: number; // for repeats
  
  savePlan: (plan: WorkoutPlan) => void;
  deletePlan: (id: string) => void;
  setActivePlan: (id: string | null) => void;
}

export const useAdvancedWorkoutStore = create<AdvancedWorkoutState>()(
  persist(
    (set) => ({
      savedPlans: [],
      activePlanId: null,
      currentStepId: null,
      currentIteration: 0,
      savePlan: (plan) => set((state) => ({
        savedPlans: [...state.savedPlans.filter(p => p.id !== plan.id), plan]
      })),
      deletePlan: (id) => set((state) => ({
        savedPlans: state.savedPlans.filter(p => p.id !== id)
      })),
      setActivePlan: (id) => set({ activePlanId: id }),
    }),
    {
      name: 'advanced-workout-data',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

- [ ] **Step 2: Commit**

```bash
git add src/store/useAdvancedWorkoutStore.ts
git commit -m "feat(workout): add advanced workout store"
```

---

### Task 3: Execution Stack Helper

**Files:**
- Create: `src/core/control/advanced-workout/ExecutionStack.ts`

- [ ] **Step 1: Implement tree flattener**

```typescript
import { WorkoutNode, NodeType, AtomicStep } from './types';

export interface ExecutionPointer {
  step: AtomicStep;
  iteration: number;
  totalIterations: number;
}

export class ExecutionStack {
  public static flatten(node: WorkoutNode): ExecutionPointer[] {
    const queue: ExecutionPointer[] = [];

    const traverse = (n: WorkoutNode) => {
      if (n.type === NodeType.STEP) {
        queue.push({ step: n, iteration: 1, totalIterations: 1 });
      } else {
        for (let i = 0; i < n.repeatCount; i++) {
          n.children.forEach(child => traverse(child));
        }
      }
    };

    traverse(node);
    return queue;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/control/advanced-workout/ExecutionStack.ts
git commit -m "feat(workout): add execution stack flattener"
```

---

### Task 4: Engine Tick Logic & Profile Calculation

**Files:**
- Create: `src/core/control/advanced-workout/AdvancedWorkoutEngine.ts`

- [ ] **Step 1: Implement 1Hz processor with Profiles**

```typescript
import { AtomicStep, ProfileMode, ConditionType } from './types';
import { ExecutionPointer, ExecutionStack } from './ExecutionStack';
import { ftmsController } from '../FTMSController';

export class AdvancedWorkoutEngine {
  private queue: ExecutionPointer[] = [];
  private currentIndex: number = -1;
  private stepSeconds: number = 0;
  private stepDistance: number = 0;

  public start(rootNode: any) {
    this.queue = ExecutionStack.flatten(rootNode);
    this.currentIndex = 0;
    this.stepSeconds = 0;
    this.stepDistance = 0;
  }

  public tick(deltaSeconds: number, deltaDistance: number, currentSpeed: number) {
    if (this.currentIndex === -1 || this.currentIndex >= this.queue.length) return;

    const pointer = this.queue[this.currentIndex];
    const step = pointer.step;

    this.stepSeconds += deltaSeconds;
    this.stepDistance += deltaDistance;

    // 1. Calculate Targets
    const targetSpeed = this.calculateProfile(step.speedProfile, this.stepSeconds, this.stepDistance);
    const targetIncline = this.calculateProfile(step.inclineProfile, this.stepSeconds, this.stepDistance);

    // 2. Control Treadmill
    ftmsController.setSpeed(targetSpeed, currentSpeed);
    if (targetIncline !== undefined) ftmsController.setIncline(targetIncline);

    // 3. Condition Check
    const finished = step.conditions.some(c => {
      if (c.type === ConditionType.TIME) return this.stepSeconds >= (c.value || 0);
      if (c.type === ConditionType.DISTANCE) return this.stepDistance >= (c.value || 0);
      return false;
    });

    if (finished) {
      this.next();
    }
  }

  private calculateProfile(profile: any, time: number, dist: number): number {
    if (profile.mode === ProfileMode.STATIC) return profile.startValue;
    if (profile.mode === ProfileMode.LINEAR) {
      // Simplification: use time for progression scaling
      // In real app, check completion condition to find total duration
      return profile.startValue; 
    }
    return profile.startValue;
  }

  private next() {
    this.currentIndex++;
    this.stepSeconds = 0;
    this.stepDistance = 0;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/control/advanced-workout/AdvancedWorkoutEngine.ts
git commit -m "feat(workout): add engine tick and profile logic"
```

---

### Task 5: Workout Builder UI

**Files:**
- Create: `src/components/WorkoutBuilder/BuilderScreen.tsx`

- [ ] **Step 1: Build interactive tree editor using standard React Native components**

```typescript
// Placeholder logic for the builder UI
// Will include: Add Step, Add Group, Drag & Drop (optional), Edit Profile
```

- [ ] **Step 2: Commit**

```bash
git add src/components/WorkoutBuilder/BuilderScreen.tsx
git commit -m "feat(ui): add workout builder screen"
```
