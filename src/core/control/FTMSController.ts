import { Buffer } from 'buffer';
import { Device } from 'react-native-ble-plx';
import { safetyGuard } from './SafetyGuard';

const FTMS_SERVICE_UUID = '00001826-0000-1000-8000-00805f9b34fb';
const FTMS_CONTROL_POINT_CHAR_UUID = '00002ad9-0000-1000-8000-00805f9b34fb';

// FTMS Control Point OpCodes
const OP_REQUEST_CONTROL = 0x00;
const OP_SET_TARGET_SPEED = 0x02;
const OP_SET_TARGET_INCLINE = 0x03;
const OP_STOP_OR_PAUSE = 0x08;

/**
 * FTMSController handles the low-level binary commands sent over BLE.
 */
export class FTMSController {
  private device: Device | null = null;
  private hasControl: boolean = false;
  private lastCommandTime: number = 0;
  private readonly commandThrottleMs = 500; // Rate limit to 2Hz

  public setDevice(device: Device | null) {
    this.device = device;
    this.hasControl = false;
  }

  private async requestControl() {
    if (!this.device || this.hasControl) return;

    try {
      // Request Control: 0x00
      const payload = Buffer.from([OP_REQUEST_CONTROL]).toString('base64');
      await this.device.writeCharacteristicWithResponseForService(
        FTMS_SERVICE_UUID,
        FTMS_CONTROL_POINT_CHAR_UUID,
        payload
      );
      this.hasControl = true;
      console.log('[FTMSController] Control Granted');
    } catch (e) {
      console.error('[FTMSController] Control Request Failed:', e);
      this.hasControl = false;
    }
  }

  public async setSpeed(speedKmH: number, currentSpeed: number) {
    const validatedSpeed = safetyGuard.validateSpeed(speedKmH, currentSpeed);
    await this.sendCommand(OP_SET_TARGET_SPEED, validatedSpeed * 100); // FTMS uses Resolution 0.01 km/h
  }

  public async setIncline(inclinePercent: number) {
    const validatedIncline = safetyGuard.validateIncline(inclinePercent);
    await this.sendCommand(OP_SET_TARGET_INCLINE, validatedIncline * 10); // FTMS uses Resolution 0.1 %
  }

  public async stop() {
    await this.sendCommand(OP_STOP_OR_PAUSE, 0x01); // 0x01 = STOP
  }

  private async sendCommand(opCode: number, value?: number) {
    if (!this.device) return;

    // 1. Ensure we have control
    if (!this.hasControl) await this.requestControl();

    // 2. Throttle checks
    const now = Date.now();
    if (now - this.lastCommandTime < this.commandThrottleMs) {
      console.warn('[FTMSController] Command Throttled');
      return;
    }

    try {
      let payload: Buffer;
      if (value !== undefined) {
        payload = Buffer.alloc(3);
        payload.writeUInt8(opCode, 0);
        payload.writeUInt16LE(value, 1);
      } else {
        payload = Buffer.from([opCode]);
      }

      await this.device.writeCharacteristicWithResponseForService(
        FTMS_SERVICE_UUID,
        FTMS_CONTROL_POINT_CHAR_UUID,
        payload.toString('base64')
      );
      
      this.lastCommandTime = now;
      console.log(`[FTMSController] Sent OpCode: 0x${opCode.toString(16)} Value: ${value}`);
    } catch (e) {
      console.error(`[FTMSController] Command ${opCode} Failed:`, e);
    }
  }
}

export const ftmsController = new FTMSController();
