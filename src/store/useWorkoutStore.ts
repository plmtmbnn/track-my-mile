import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
const storage = createMMKV();

const mmkvStorage = {
  setItem: (name: string, value: string) => storage.set(name, value),
  getItem: (name: string) => storage.getString(name) ?? null,
  removeItem: (name: string) => storage.delete(name),
};

export interface WorkoutSession {
  id: string;
  date: string;
  duration: number; // seconds
  distance: number; // meters
  calories: number; // kcal
  avgSpeed: number; // km/h
  maxSpeed: number; // km/h
  samples: Array<{ time: number; speed: number; incline: number }>;
}

export interface Goal {
  type: 'distance' | 'time' | 'calories';
  target: number;
  current: number;
}

import { WorkoutPoint } from '../utils/GPXGenerator';

interface WorkoutState {
  history: WorkoutSession[];
  goals: Goal[];
  currentSessionPoints: WorkoutPoint[];
  personalRecords: {
    maxSpeed: number;
    longestDistance: number;
    mostCalories: number;
  };
  addSession: (session: WorkoutSession) => void;
  updateGoal: (goal: Goal) => void;
  addSessionPoint: (point: WorkoutPoint) => void;
  clearSessionPoints: () => void;
  clearHistory: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      history: [],
      goals: [
        { type: 'distance', target: 5000, current: 0 },
        { type: 'time', target: 1800, current: 0 },
        { type: 'calories', target: 300, current: 0 },
      ],
      currentSessionPoints: [],
      personalRecords: {
        maxSpeed: 0,
        longestDistance: 0,
        mostCalories: 0,
      },
      addSession: (session) =>
        set((state) => {
          const newHistory = [session, ...state.history].slice(0, 100);
          const pr = state.personalRecords;
          return {
            history: newHistory,
            personalRecords: {
              maxSpeed: Math.max(pr.maxSpeed, session.maxSpeed),
              longestDistance: Math.max(pr.longestDistance, session.distance),
              mostCalories: Math.max(pr.mostCalories, session.calories),
            },
          };
        }),
      updateGoal: (goal) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.type === goal.type ? goal : g)),
        })),
      addSessionPoint: (point) =>
        set((state) => ({
          currentSessionPoints: [...state.currentSessionPoints, point],
        })),
      clearSessionPoints: () => set({ currentSessionPoints: [] }),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => mmkvStorage),
      // We don't want to persist currentSessionPoints if the app crashes usually,
      // but MMKV is fast enough. Let's exclude it from persistence to be safe/clean.
      partialize: (state) => {
        const { currentSessionPoints, ...rest } = state;
        return rest;
      },
    }
  )
);
