// FTMS (Fitness Machine Service) Bluetooth UUIDs & Types
// Ref: Bluetooth SIG FTMS Specification

// ─── Service & Characteristic UUIDs ─────────────────────────────────────────
export const FTMS_SERVICE_UUID = '00001826-0000-1000-8000-00805f9b34fb';

export const FTMS_CHARACTERISTICS = {
  // Mandatory
  FITNESS_MACHINE_FEATURE: '00002acc-0000-1000-8000-00805f9b34fb',
  TREADMILL_DATA: '00002acd-0000-1000-8000-00805f9b34fb',
  FITNESS_MACHINE_STATUS: '00002ada-0000-1000-8000-00805f9b34fb',
  FITNESS_MACHINE_CONTROL_POINT: '00002ad9-0000-1000-8000-00805f9b34fb',
  // Optional but common
  TRAINING_STATUS: '00002ad3-0000-1000-8000-00805f9b34fb',
  SUPPORTED_SPEED_RANGE: '00002ad4-0000-1000-8000-00805f9b34fb',
  SUPPORTED_INCLINATION_RANGE: '00002ad5-0000-1000-8000-00805f9b34fb',
  SUPPORTED_RESISTANCE_LEVEL_RANGE: '00002ad6-0000-1000-8000-00805f9b34fb',
  SUPPORTED_HEART_RATE_RANGE: '00002ad7-0000-1000-8000-00805f9b34fb',
  SUPPORTED_POWER_RANGE: '00002ad8-0000-1000-8000-00805f9b34fb',
} as const;

// ─── FTMS Control Point Op Codes ─────────────────────────────────────────────
export const FTMS_OPCODES = {
  REQUEST_CONTROL: 0x00,
  RESET: 0x01,
  SET_TARGET_SPEED: 0x02,
  SET_TARGET_INCLINATION: 0x03,
  SET_TARGET_RESISTANCE_LEVEL: 0x04,
  SET_TARGET_POWER: 0x05,
  SET_TARGET_HEART_RATE: 0x06,
  START_OR_RESUME: 0x07,
  STOP_OR_PAUSE: 0x08,
  SET_TARGETED_EXPENDED_ENERGY: 0x09,
  SET_TARGETED_STEPS: 0x0A,
  SET_TARGETED_STRIDES: 0x0B,
  SET_TARGETED_DISTANCE: 0x0C,
  SET_TARGETED_TRAINING_TIME: 0x0D,
  RESPONSE_CODE: 0x80,
} as const;

// ─── FTMS Control Point Result Codes ─────────────────────────────────────────
export const FTMS_RESULT_CODES = {
  SUCCESS: 0x01,
  OP_CODE_NOT_SUPPORTED: 0x02,
  INVALID_PARAMETER: 0x03,
  OPERATION_FAILED: 0x04,
  CONTROL_NOT_PERMITTED: 0x05,
} as const;

// ─── TypeScript Types ─────────────────────────────────────────────────────────
export interface TreadmillData {
  instantaneousSpeed: number;       // km/h, resolution 0.01
  averageSpeed: number;             // km/h
  totalDistance: number;            // meters
  inclination: number;              // %, resolution 0.1
  rampAngle: number;                // degrees, resolution 0.1
  positiveElevationGain: number;    // meters
  negativeElevationGain: number;    // meters
  instantaneousPace: number;        // min/km
  averagePace: number;              // min/km
  expendedEnergy: number;           // kcal
  energyPerHour: number;            // kcal/h
  energyPerMinute: number;          // kcal/min
  heartRate: number;                // bpm
  metabolicEquivalent: number;      // METs, resolution 0.1
  elapsedTime: number;              // seconds
  remainingTime: number;            // seconds
}

export interface FitnessMachineFeature {
  averageSpeedSupported: boolean;
  cadenceSupported: boolean;
  totalDistanceSupported: boolean;
  inclinationSupported: boolean;
  elevationGainSupported: boolean;
  paceSupported: boolean;
  stepCountSupported: boolean;
  resistanceLevelSupported: boolean;
  strideCountSupported: boolean;
  expendedEnergySupported: boolean;
  heartRateMeasurementSupported: boolean;
  metabolicEquivalentSupported: boolean;
  elapsedTimeSupported: boolean;
  remainingTimeSupported: boolean;
  powerMeasurementSupported: boolean;
  forceonBeltAndPowerOutputSupported: boolean;
  userDataRetentionSupported: boolean;
}

export interface SupportedRange {
  minimum: number;
  maximum: number;
  increment: number;
}

export interface ScannedDevice {
  id: string;
  name: string | null;
  rssi: number | null;
  serviceUUIDs: string[] | null;
}

export type ConnectionStatus = 
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'error';

export type MachineStatus =
  | 'stopped'
  | 'started'
  | 'paused'
  | 'stopped_by_safety';

export interface FTMSState {
  connectionStatus: ConnectionStatus;
  machineStatus: MachineStatus;
  connectedDevice: ScannedDevice | null;
  treadmillData: TreadmillData;
  features: Partial<FitnessMachineFeature>;
  speedRange: SupportedRange;
  inclinationRange: SupportedRange;
  targetSpeed: number;
  targetInclination: number;
  error: string | null;
}

// ─── Default values ───────────────────────────────────────────────────────────
export const DEFAULT_TREADMILL_DATA: TreadmillData = {
  instantaneousSpeed: 0,
  averageSpeed: 0,
  totalDistance: 0,
  inclination: 0,
  rampAngle: 0,
  positiveElevationGain: 0,
  negativeElevationGain: 0,
  instantaneousPace: 0,
  averagePace: 0,
  expendedEnergy: 0,
  energyPerHour: 0,
  energyPerMinute: 0,
  heartRate: 0,
  metabolicEquivalent: 0,
  elapsedTime: 0,
  remainingTime: 0,
};

export const DEFAULT_SPEED_RANGE: SupportedRange = {
  minimum: 0,
  maximum: 20,
  increment: 0.1,
};

export const DEFAULT_INCLINATION_RANGE: SupportedRange = {
  minimum: -3,
  maximum: 15,
  increment: 0.5,
};
