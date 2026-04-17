# Fix Advanced Workout Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix storage method, improve persistence for resume support, and add validation to the advanced workout store.

**Architecture:** Update Zustand store configuration and actions to ensure data integrity and persistence.

**Tech Stack:** React Native, Zustand, MMKV.

---

### Task 1: Update Storage Configuration

**Files:**
- Modify: `src/store/useAdvancedWorkoutStore.ts`

- [ ] **Step 1: Replace storage instance with isolated MMKV instance**

```typescript
// Old
const storage = createMMKV();

// New
const storage = new MMKV({ id: 'advanced-workout-storage' });
```

- [ ] **Step 2: Fix removeItem method in mmkvStorage**

```typescript
// Old
removeItem: (name: string) => storage.remove(name),

// New
removeItem: (name: string) => storage.delete(name),
```

### Task 2: Improve Persistence for Resume Support

**Files:**
- Modify: `src/store/useAdvancedWorkoutStore.ts`

- [ ] **Step 1: Update partialize to include progress state**

```typescript
// Old
      partialize: (state) => {
        const { currentStepId, currentIteration, ...rest } = state;
        return rest;
      },

// New
      partialize: (state) => ({
        savedPlans: state.savedPlans,
        activePlanId: state.activePlanId,
        currentStepId: state.currentStepId,
        currentIteration: state.currentIteration,
      }),
```

### Task 3: Add Validation and Verify Actions

**Files:**
- Modify: `src/store/useAdvancedWorkoutStore.ts`

- [ ] **Step 1: Add validation to setActivePlan**

```typescript
// Old
      setActivePlan: (id) =>
        set({
          activePlanId: id,
          currentStepId: null,
          currentIteration: 0,
        }),

// New
      setActivePlan: (id) =>
        set((state) => {
          if (id !== null && !state.savedPlans.some((p) => p.id === id)) {
            console.warn(`Attempted to set active plan to non-existent ID: ${id}`);
            return state;
          }
          return {
            activePlanId: id,
            currentStepId: null,
            currentIteration: 0,
          };
        }),
```

- [ ] **Step 2: Verify resetProgress clears state**

(Already implemented as `resetProgress: () => set({ currentStepId: null, currentIteration: 0 })`, just ensure it remains correct).

### Task 4: Verification and Commit

- [ ] **Step 1: Run TypeScript compiler to verify types**

Run: `npx tsc --noEmit`

- [ ] **Step 2: Commit changes**

```bash
git add src/store/useAdvancedWorkoutStore.ts
git commit -m "fix(workout): fix storage method and improve store persistence for resume support"
```
