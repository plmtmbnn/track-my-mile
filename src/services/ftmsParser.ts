/**
 * FTMS Treadmill Data Parser
 * Parses raw BLE characteristic bytes per Bluetooth SIG FTMS Spec (v1.0)
 * Treadmill Data Characteristic: 0x2ACD
 */

import { TreadmillData, DEFAULT_TREADMILL_DATA, FitnessMachineFeature, SupportedRange } from '@/types/ftms';

// ─── Bit flag positions for Treadmill Data (Flags field, 16-bit) ──────────────
const FLAGS = {
  MORE_DATA: 0,                  // bit 0: if 0, Instantaneous Speed present
  AVERAGE_SPEED: 1,
  TOTAL_DISTANCE: 2,
  INCLINATION_AND_RAMP_ANGLE: 3,
  ELEVATION_GAIN: 4,
  INSTANTANEOUS_PACE: 5,
  AVERAGE_PACE: 6,
  EXPENDED_ENERGY: 7,
  HEART_RATE: 8,
  METABOLIC_EQUIVALENT: 9,
  ELAPSED_TIME: 10,
  REMAINING_TIME: 11,
  FORCE_ON_BELT: 12,
} as const;

function readUInt16LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8);
}

function readInt16LE(data: Uint8Array, offset: number): number {
  const val = readUInt16LE(data, offset);
  return val >= 0x8000 ? val - 0x10000 : val;
}

function readUInt24LE(data: Uint8Array, offset: number): number {
  return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16);
}

function isBitSet(flags: number, bit: number): boolean {
  return (flags & (1 << bit)) !== 0;
}

/**
 * Parse raw bytes from Treadmill Data Characteristic (0x2ACD)
 */
export function parseTreadmillData(
  base64Data: string,
  previous: TreadmillData = DEFAULT_TREADMILL_DATA
): TreadmillData {
  try {
    const bytes = Buffer.from(base64Data, 'base64');
    const data = new Uint8Array(bytes);

    if (data.length < 4) return previous;

    const flags = readUInt16LE(data, 0);
    let offset = 2;

    const result: TreadmillData = { ...previous };

    // Instantaneous Speed (0.01 km/h) — present if bit 0 is 0
    if (!isBitSet(flags, FLAGS.MORE_DATA) && offset + 2 <= data.length) {
      result.instantaneousSpeed = readUInt16LE(data, offset) * 0.01;
      offset += 2;
    }

    // Average Speed (0.01 km/h)
    if (isBitSet(flags, FLAGS.AVERAGE_SPEED) && offset + 2 <= data.length) {
      result.averageSpeed = readUInt16LE(data, offset) * 0.01;
      offset += 2;
    }

    // Total Distance (meters, 3 bytes)
    if (isBitSet(flags, FLAGS.TOTAL_DISTANCE) && offset + 3 <= data.length) {
      result.totalDistance = readUInt24LE(data, offset);
      offset += 3;
    }

    // Inclination + Ramp Angle (0.1%)
    if (isBitSet(flags, FLAGS.INCLINATION_AND_RAMP_ANGLE) && offset + 4 <= data.length) {
      result.inclination = readInt16LE(data, offset) * 0.1;
      offset += 2;
      result.rampAngle = readInt16LE(data, offset) * 0.1;
      offset += 2;
    }

    // Positive + Negative Elevation Gain (0.1 m)
    if (isBitSet(flags, FLAGS.ELEVATION_GAIN) && offset + 4 <= data.length) {
      result.positiveElevationGain = readUInt16LE(data, offset) * 0.1;
      offset += 2;
      result.negativeElevationGain = readUInt16LE(data, offset) * 0.1;
      offset += 2;
    }

    // Instantaneous Pace (1/500 min/km)
    if (isBitSet(flags, FLAGS.INSTANTANEOUS_PACE) && offset + 2 <= data.length) {
      const raw = readUInt16LE(data, offset);
      result.instantaneousPace = raw > 0 ? 500 / raw : 0;
      offset += 2;
    }

    // Average Pace (1/500 min/km)
    if (isBitSet(flags, FLAGS.AVERAGE_PACE) && offset + 2 <= data.length) {
      const raw = readUInt16LE(data, offset);
      result.averagePace = raw > 0 ? 500 / raw : 0;
      offset += 2;
    }

    // Expended Energy (kcal, kcal/h, kcal/min)
    if (isBitSet(flags, FLAGS.EXPENDED_ENERGY) && offset + 5 <= data.length) {
      result.expendedEnergy = readUInt16LE(data, offset);
      offset += 2;
      result.energyPerHour = readUInt16LE(data, offset);
      offset += 2;
      result.energyPerMinute = data[offset];
      offset += 1;
    }

    // Heart Rate (bpm)
    if (isBitSet(flags, FLAGS.HEART_RATE) && offset + 1 <= data.length) {
      result.heartRate = data[offset];
      offset += 1;
    }

    // Metabolic Equivalent (0.1 METs)
    if (isBitSet(flags, FLAGS.METABOLIC_EQUIVALENT) && offset + 1 <= data.length) {
      result.metabolicEquivalent = data[offset] * 0.1;
      offset += 1;
    }

    // Elapsed Time (seconds)
    if (isBitSet(flags, FLAGS.ELAPSED_TIME) && offset + 2 <= data.length) {
      result.elapsedTime = readUInt16LE(data, offset);
      offset += 2;
    }

    // Remaining Time (seconds)
    if (isBitSet(flags, FLAGS.REMAINING_TIME) && offset + 2 <= data.length) {
      result.remainingTime = readUInt16LE(data, offset);
      offset += 2;
    }

    return result;
  } catch (e) {
    console.warn('[FTMS Parser] Error parsing treadmill data:', e);
    return previous;
  }
}

/**
 * Parse Fitness Machine Feature Characteristic (0x2ACC)
 */
export function parseFitnessMachineFeature(base64Data: string): Partial<FitnessMachineFeature> {
  try {
    const bytes = Buffer.from(base64Data, 'base64');
    const data = new Uint8Array(bytes);
    if (data.length < 4) return {};

    const flags = data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24);

    return {
      averageSpeedSupported: !!(flags & (1 << 0)),
      cadenceSupported: !!(flags & (1 << 1)),
      totalDistanceSupported: !!(flags & (1 << 2)),
      inclinationSupported: !!(flags & (1 << 3)),
      elevationGainSupported: !!(flags & (1 << 4)),
      paceSupported: !!(flags & (1 << 5)),
      stepCountSupported: !!(flags & (1 << 6)),
      resistanceLevelSupported: !!(flags & (1 << 7)),
      strideCountSupported: !!(flags & (1 << 8)),
      expendedEnergySupported: !!(flags & (1 << 9)),
      heartRateMeasurementSupported: !!(flags & (1 << 10)),
      metabolicEquivalentSupported: !!(flags & (1 << 11)),
      elapsedTimeSupported: !!(flags & (1 << 12)),
      remainingTimeSupported: !!(flags & (1 << 13)),
      powerMeasurementSupported: !!(flags & (1 << 14)),
      forceonBeltAndPowerOutputSupported: !!(flags & (1 << 15)),
      userDataRetentionSupported: !!(flags & (1 << 16)),
    };
  } catch {
    return {};
  }
}

/**
 * Parse Supported Speed/Inclination Range Characteristic
 */
export function parseSupportedRange(base64Data: string, resolution: number): SupportedRange {
  try {
    const bytes = Buffer.from(base64Data, 'base64');
    const data = new Uint8Array(bytes);
    if (data.length < 6) throw new Error('Too short');

    const min = readInt16LE(data, 0) * resolution;
    const max = readInt16LE(data, 2) * resolution;
    const increment = readUInt16LE(data, 4) * resolution;

    return { minimum: min, maximum: max, increment };
  } catch {
    return { minimum: 0, maximum: 20, increment: 0.1 };
  }
}

/**
 * Build Control Point command bytes
 */
export function buildControlCommand(opcode: number, ...params: number[]): string {
  const buffer = Buffer.from([opcode, ...params]);
  return buffer.toString('base64');
}

/**
 * Build Set Target Speed command
 * Speed in km/h → resolution 0.01 → multiply by 100
 */
export function buildSetSpeedCommand(speedKmh: number): string {
  const raw = Math.round(speedKmh * 100);
  const lo = raw & 0xFF;
  const hi = (raw >> 8) & 0xFF;
  return buildControlCommand(0x02, lo, hi);
}

/**
 * Build Set Target Inclination command
 * Inclination in % → resolution 0.1 → multiply by 10
 */
export function buildSetInclinationCommand(inclinationPercent: number): string {
  const raw = Math.round(inclinationPercent * 10);
  // Handle negative (signed 16-bit)
  const unsigned = raw < 0 ? raw + 0x10000 : raw;
  const lo = unsigned & 0xFF;
  const hi = (unsigned >> 8) & 0xFF;
  return buildControlCommand(0x03, lo, hi);
}

// ─── Format helpers ───────────────────────────────────────────────────────────
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatPace(minPerKm: number): string {
  if (minPerKm <= 0 || !isFinite(minPerKm)) return '--:--';
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${meters} m`;
}
