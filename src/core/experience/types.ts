export enum WorkoutMode {
  FREE_RUN = 'FREE_RUN',
  INTERVAL = 'INTERVAL',
}

export enum IntervalPhase {
  WARMUP = 'WARMUP',
  WORK = 'WORK',
  REST = 'REST',
  COOLDOWN = 'COOLDOWN',
}

export interface WorkoutPhaseDetail {
  mode: WorkoutMode;
  currentPhase?: IntervalPhase;
  timeRemainingInPhase?: number; // seconds
}

export enum PaceTrend {
  STABLE = 'STABLE',
  INCREASING = 'INCREASING',
  DECREASING = 'DECREASING',
}

export interface SessionSummary {
  totalDistance: number;
  avgPace: number;
  bestPace: number;
  totalTime: number;
  totalCalories: number;
  laps: any[]; // From Phase 2 LapTracker
}
