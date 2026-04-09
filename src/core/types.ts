export enum BLEConnectionState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
}

export enum WorkoutState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  STOPPED = 'STOPPED',
  SAVED = 'SAVED',
}

export interface TreadmillMetrics {
  speed: number; // km/h (>= 0)
  incline: number; // %
  distance: number; // m (accumulated, non-resetting)
  duration: number; // s (accumulated)
  calories: number; // kcal
  heartRate: number; // bpm
  power: number; // W
}

export interface DeviceInfo {
  id: string;
  name: string | null;
}
