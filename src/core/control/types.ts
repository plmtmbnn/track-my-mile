export enum ControlMode {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO', // Engine controls the treadmill
}

export interface TreadmillCommand {
  type: 'SET_SPEED' | 'SET_INCLINE' | 'STOP';
  value?: number;
  timestamp: number;
}

export interface WorkoutStep {
  id: string;
  name: string;
  duration: number; // seconds
  targetSpeed: number; // km/h
  targetIncline?: number; // %
  notes?: string;
}

export interface WorkoutConfig {
  id: string;
  name: string;
  steps: WorkoutStep[];
}

export enum EngineStatus {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

export interface ControlLimits {
  maxSpeed: number;
  minSpeed: number;
  maxIncline: number;
  minIncline: number;
  maxSpeedChangePerStep: number; // Prevent sudden 10km/h jumps
}
