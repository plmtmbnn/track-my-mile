export interface RawData {
  speed: number;      // km/h
  distance: number;   // meters
  incline: number;    // %
  elapsedTime: number; // seconds
  heartRate?: number;  // bpm
  power?: number;      // watts
  timestamp: number;   // ms
}

export interface ProcessedData {
  speed: number;          // km/h (smoothed)
  pace: number;           // min/km
  distance: number;       // meters (validated)
  duration: number;       // seconds
  incline: number;        // %
  calories: number;       // kcal
  heartRate: number;      // bpm
  isSpike: boolean;       // diagnostic flag
  timestamp: number;
}

export interface TrackPoint {
  timestamp: number;
  speed: number;
  pace: number;
  distance: number;
  incline: number;
  heartRate: number;
}

export interface Lap {
  lapNumber: number;
  startTime: number;      // seconds into workout
  endTime: number;
  distance: number;       // meters in this lap (usually 1000)
  duration: number;       // seconds
  avgSpeed: number;
  avgPace: number;
}
