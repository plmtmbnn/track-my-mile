import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import { WorkoutPlan } from '../core/control/advanced-workout/types';

const storage = createMMKV();

const mmkvStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.remove(name),
};

interface AdvancedWorkoutState {
  savedPlans: WorkoutPlan[];
  activePlanId: string | null;
  currentStepId: string | null;
  currentIteration: number;
  
  // Actions
  savePlan: (plan: WorkoutPlan) => void;
  deletePlan: (id: string) => void;
  setActivePlan: (id: string | null) => void;
  setCurrentStep: (stepId: string | null) => void;
  setCurrentIteration: (iteration: number) => void;
  resetProgress: () => void;
}

export const useAdvancedWorkoutStore = create<AdvancedWorkoutState>()(
  persist(
    (set) => ({
      savedPlans: [],
      activePlanId: null,
      currentStepId: null,
      currentIteration: 0,

      savePlan: (plan) =>
        set((state) => {
          const exists = state.savedPlans.find((p) => p.id === plan.id);
          if (exists) {
            return {
              savedPlans: state.savedPlans.map((p) => (p.id === plan.id ? plan : p)),
            };
          }
          return {
            savedPlans: [...state.savedPlans, plan],
          };
        }),

      deletePlan: (id) =>
        set((state) => ({
          savedPlans: state.savedPlans.filter((p) => p.id !== id),
          activePlanId: state.activePlanId === id ? null : state.activePlanId,
        })),

      setActivePlan: (id) =>
        set({
          activePlanId: id,
          currentStepId: null,
          currentIteration: 0,
        }),

      setCurrentStep: (stepId) => set({ currentStepId: stepId }),

      setCurrentIteration: (iteration) => set({ currentIteration: iteration }),

      resetProgress: () => set({ currentStepId: null, currentIteration: 0 }),
    }),
    {
      name: 'advanced-workout-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => {
        const { currentStepId, currentIteration, ...rest } = state;
        return rest;
      },
    }
  )
);
