import { Buffer } from 'buffer';

export interface TreadmillData {
  speed?: number; // km/h
  averageSpeed?: number; // km/h
  totalDistance?: number; // m
  incline?: number; // %
  rampAngle?: number; // degree
  positiveElevationGain?: number; // m
  negativeElevationGain?: number; // m
  instantaneousPace?: number; // km/h or min/km
  averagePace?: number; // km/h or min/km
  totalEnergy?: number; // kcal
  energyPerHour?: number; // kcal
  energyPerMinute?: number; // kcal
  heartRate?: number; // bpm
  metabolicEquivalent?: number; // METs
  elapsedTime?: number; // s
  remainingTime?: number; // s
  forceOnBelt?: number; // N
  powerOutput?: number; // W
}

export const parseFTMSTreadmillData = (base64Value: string): TreadmillData => {
  const buffer = Buffer.from(base64Value, 'base64');
  let offset = 0;

  if (buffer.length < 2) {
    return {};
  }

  const flags = buffer.readUInt16LE(offset);
  offset += 2;

  const data: TreadmillData = {};

  // Bit 0: More Data. If 0, Instantaneous Speed is present.
  const moreData = (flags & 0x01) !== 0;
  if (!moreData) {
    data.speed = buffer.readUInt16LE(offset) / 100;
    offset += 2;
  }

  // Bit 1: Average Speed Present
  if ((flags & 0x02) !== 0) {
    data.averageSpeed = buffer.readUInt16LE(offset) / 100;
    offset += 2;
  }

  // Bit 2: Total Distance Present
  if ((flags & 0x04) !== 0) {
    // uint24 is 3 bytes
    const b0 = buffer.readUInt8(offset);
    const b1 = buffer.readUInt8(offset + 1);
    const b2 = buffer.readUInt8(offset + 2);
    data.totalDistance = b0 | (b1 << 8) | (b2 << 16);
    offset += 3;
  }

  // Bit 3: Incline and Ramp Angle Setting Present
  if ((flags & 0x08) !== 0) {
    data.incline = buffer.readInt16LE(offset) / 10;
    offset += 2;
    data.rampAngle = buffer.readInt16LE(offset) / 10;
    offset += 2;
  }

  // Bit 4: Elevation Gain Present
  if ((flags & 0x10) !== 0) {
    data.positiveElevationGain = buffer.readUInt16LE(offset) / 10;
    offset += 2;
    data.negativeElevationGain = buffer.readUInt16LE(offset) / 10;
    offset += 2;
  }

  // Bit 5: Instantaneous Pace Present
  if ((flags & 0x20) !== 0) {
    data.instantaneousPace = buffer.readUInt8(offset) / 10;
    offset += 1;
  }

  // Bit 6: Average Pace Present
  if ((flags & 0x40) !== 0) {
    data.averagePace = buffer.readUInt8(offset) / 10;
    offset += 1;
  }

  // Bit 7: Expended Energy Present
  if ((flags & 0x80) !== 0) {
    data.totalEnergy = buffer.readUInt16LE(offset);
    offset += 2;
    data.energyPerHour = buffer.readUInt16LE(offset);
    offset += 2;
    data.energyPerMinute = buffer.readUInt8(offset);
    offset += 1;
  }

  // Bit 8: Heart Rate Present
  if ((flags & 0x0100) !== 0) {
    data.heartRate = buffer.readUInt8(offset);
    offset += 1;
  }

  // Bit 9: Metabolic Equivalent Present
  if ((flags & 0x0200) !== 0) {
    data.metabolicEquivalent = buffer.readUInt8(offset) / 10;
    offset += 1;
  }

  // Bit 10: Elapsed Time Present
  if ((flags & 0x0400) !== 0) {
    data.elapsedTime = buffer.readUInt16LE(offset);
    offset += 2;
  }

  // Bit 11: Remaining Time Present
  if ((flags & 0x0800) !== 0) {
    data.remainingTime = buffer.readUInt16LE(offset);
    offset += 2;
  }

  // Bit 12: Force on Belt and Power Output Present
  if ((flags & 0x1000) !== 0) {
    data.forceOnBelt = buffer.readInt16LE(offset);
    offset += 2;
    data.powerOutput = buffer.readInt16LE(offset);
    offset += 2;
  }

  return data;
};
