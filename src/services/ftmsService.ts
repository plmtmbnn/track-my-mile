/**
 * FTMS BLE Service
 * ⚠️  REQUIRES NATIVE BUILD — does NOT work in Expo Go.
 *     Run: npx expo prebuild --clean  →  npx expo run:android
 */

import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
import {
  FTMS_SERVICE_UUID,
  FTMS_CHARACTERISTICS,
  ScannedDevice,
  TreadmillData,
  DEFAULT_TREADMILL_DATA,
} from '@/types/ftms';
import {
  parseTreadmillData,
  parseFitnessMachineFeature,
  parseSupportedRange,
  buildControlCommand,
  buildSetSpeedCommand,
  buildSetInclinationCommand,
} from './ftmsParser';
import { FTMS_OPCODES } from '@/types/ftms';

// ─── Native module guard ──────────────────────────────────────────────────────
// react-native-ble-plx registers its native side as 'BleClientManager'.
// If null → not a native build (Expo Go, plain bundler, etc.)
function isBleAvailable(): boolean {
  return NativeModules.BleClientManager != null;
}

type BleManagerType = InstanceType<typeof import('react-native-ble-plx').BleManager>;
type DeviceType = import('react-native-ble-plx').Device;
type StateType = import('react-native-ble-plx').State;

export type OnDataUpdate = (data: TreadmillData) => void;
export type OnStatusChange = (status: string) => void;
export type OnError = (error: string) => void;
export type OnDevicesFound = (devices: ScannedDevice[]) => void;

class FTMSService {
  private _manager: BleManagerType | null = null;
  private connectedDevice: DeviceType | null = null;
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;
  private scannedDevices: Map<string, ScannedDevice> = new Map();
  private isControlGranted = false;
  private currentData: TreadmillData = { ...DEFAULT_TREADMILL_DATA };

  private onDataUpdate: OnDataUpdate | null = null;
  private onStatusChange: OnStatusChange | null = null;
  private onError: OnError | null = null;
  private onDevicesFound: OnDevicesFound | null = null;

  // ─── Lazy + guarded manager getter ───────────────────────────────────────────
  // Using require() instead of top-level import so that BleManager() constructor
  // is never called unless we KNOW the native module is present.
  private getManager(): BleManagerType {
    if (this._manager) return this._manager;

    if (!isBleAvailable()) {
      throw new Error(
        'BLE native module (BleClientManager) not found.\n\n' +
        'Expo Go does NOT support react-native-ble-plx.\n' +
        'Build the app with native code:\n\n' +
        '  npx expo prebuild --clean\n' +
        '  npx expo run:android\n'
      );
    }

    // Safe to instantiate now — native module is confirmed present
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { BleManager } = require('react-native-ble-plx') as typeof import('react-native-ble-plx');
    this._manager = new BleManager();
    return this._manager;
  }

  isBleSupported(): boolean {
    return isBleAvailable();
  }

  setCallbacks(callbacks: {
    onDataUpdate?: OnDataUpdate;
    onStatusChange?: OnStatusChange;
    onError?: OnError;
    onDevicesFound?: OnDevicesFound;
  }) {
    this.onDataUpdate = callbacks.onDataUpdate ?? null;
    this.onStatusChange = callbacks.onStatusChange ?? null;
    this.onError = callbacks.onError ?? null;
    this.onDevicesFound = callbacks.onDevicesFound ?? null;
  }

  // ─── Permissions ─────────────────────────────────────────────────────────────
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'ios') return true;

    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version as number;
      if (apiLevel >= 31) {
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(results).every(r => r === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return false;
  }

  async checkBluetoothState(): Promise<StateType> {
    if (!isBleAvailable()) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { State } = require('react-native-ble-plx') as typeof import('react-native-ble-plx');
      return State.Unsupported;
    }
    return await this.getManager().state();
  }

  // ─── Scan ─────────────────────────────────────────────────────────────────────
  async startScan(timeoutMs = 15000): Promise<void> {
    this.scannedDevices.clear();
    this.onStatusChange?.('scanning');

    const manager = this.getManager();

    manager.startDeviceScan(
      [FTMS_SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          this.onError?.(`Scan error: ${error.message}`);
          this.stopScan();
          return;
        }
        if (device) {
          const scanned: ScannedDevice = {
            id: device.id,
            name: device.name ?? device.localName ?? 'Unknown Treadmill',
            rssi: device.rssi,
            serviceUUIDs: device.serviceUUIDs,
          };
          this.scannedDevices.set(device.id, scanned);
          this.onDevicesFound?.(Array.from(this.scannedDevices.values()));
        }
      }
    );

    this.scanTimeout = setTimeout(() => this.stopScan(), timeoutMs);
  }

  stopScan(): void {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    if (this._manager) {
      this._manager.stopDeviceScan();
    }
    this.onStatusChange?.('disconnected');
  }

  // ─── Connect ──────────────────────────────────────────────────────────────────
  async connect(deviceId: string): Promise<void> {
    this.onStatusChange?.('connecting');
    try {
      this.stopScan();
      const manager = this.getManager();
      const device = await manager.connectToDevice(deviceId, {
        autoConnect: false,
        requestMTU: 256,
      });
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = device;

      device.onDisconnected((error) => {
        this.connectedDevice = null;
        this.isControlGranted = false;
        this.currentData = { ...DEFAULT_TREADMILL_DATA };
        this.onStatusChange?.('disconnected');
        if (error) this.onError?.(`Disconnected: ${error.message}`);
      });

      await this.readFeatures();
      await this.requestControl();
      await this.startNotifications();
      this.onStatusChange?.('connected');
    } catch (e: any) {
      this.connectedDevice = null;
      this.onStatusChange?.('error');
      this.onError?.(`Connection failed: ${e?.message ?? 'Unknown error'}`);
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      try { await this.connectedDevice.cancelConnection(); } catch {}
      this.connectedDevice = null;
    }
    this.isControlGranted = false;
    this.currentData = { ...DEFAULT_TREADMILL_DATA };
    this.onStatusChange?.('disconnected');
  }

  // ─── Read Features ────────────────────────────────────────────────────────────
  private async readFeatures(): Promise<void> {
    if (!this.connectedDevice) return;
    try {
      const f = await this.connectedDevice.readCharacteristicForService(
        FTMS_SERVICE_UUID, FTMS_CHARACTERISTICS.FITNESS_MACHINE_FEATURE
      );
      if (f.value) parseFitnessMachineFeature(f.value);
    } catch {}
    try {
      const s = await this.connectedDevice.readCharacteristicForService(
        FTMS_SERVICE_UUID, FTMS_CHARACTERISTICS.SUPPORTED_SPEED_RANGE
      );
      if (s.value) parseSupportedRange(s.value, 0.01);
    } catch {}
    try {
      const i = await this.connectedDevice.readCharacteristicForService(
        FTMS_SERVICE_UUID, FTMS_CHARACTERISTICS.SUPPORTED_INCLINATION_RANGE
      );
      if (i.value) parseSupportedRange(i.value, 0.1);
    } catch {}
  }

  // ─── Request Control ──────────────────────────────────────────────────────────
  private async requestControl(): Promise<void> {
    if (!this.connectedDevice) return;
    try {
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        FTMS_SERVICE_UUID,
        FTMS_CHARACTERISTICS.FITNESS_MACHINE_CONTROL_POINT,
        buildControlCommand(FTMS_OPCODES.REQUEST_CONTROL)
      );
      this.isControlGranted = true;
    } catch (e) {
      console.warn('[FTMS] requestControl failed:', e);
    }
  }

  // ─── Notifications ────────────────────────────────────────────────────────────
  private async startNotifications(): Promise<void> {
    if (!this.connectedDevice) return;

    this.connectedDevice.monitorCharacteristicForService(
      FTMS_SERVICE_UUID,
      FTMS_CHARACTERISTICS.TREADMILL_DATA,
      (error, char) => {
        if (error || !char?.value) return;
        this.currentData = parseTreadmillData(char.value, this.currentData);
        this.onDataUpdate?.(this.currentData);
      }
    );

    try {
      this.connectedDevice.monitorCharacteristicForService(
        FTMS_SERVICE_UUID,
        FTMS_CHARACTERISTICS.FITNESS_MACHINE_STATUS,
        (error, char) => {
          if (error || !char?.value) return;
          const bytes = Buffer.from(char.value, 'base64');
          console.log('[FTMS] Machine status:', bytes[0]);
        }
      );
    } catch {}
  }

  // ─── Control Commands ─────────────────────────────────────────────────────────
  private async writeControlPoint(base64Data: string): Promise<void> {
    if (!this.connectedDevice) throw new Error('Not connected');
    if (!this.isControlGranted) await this.requestControl();
    await this.connectedDevice.writeCharacteristicWithResponseForService(
      FTMS_SERVICE_UUID,
      FTMS_CHARACTERISTICS.FITNESS_MACHINE_CONTROL_POINT,
      base64Data
    );
  }

  async startMachine(): Promise<void> {
    await this.writeControlPoint(buildControlCommand(FTMS_OPCODES.START_OR_RESUME));
  }
  async stopMachine(): Promise<void> {
    await this.writeControlPoint(buildControlCommand(FTMS_OPCODES.STOP_OR_PAUSE, 0x01));
  }
  async pauseMachine(): Promise<void> {
    await this.writeControlPoint(buildControlCommand(FTMS_OPCODES.STOP_OR_PAUSE, 0x02));
  }
  async setSpeed(speedKmh: number): Promise<void> {
    await this.writeControlPoint(buildSetSpeedCommand(speedKmh));
  }
  async setInclination(inclinationPercent: number): Promise<void> {
    await this.writeControlPoint(buildSetInclinationCommand(inclinationPercent));
  }
  async resetMachine(): Promise<void> {
    await this.writeControlPoint(buildControlCommand(FTMS_OPCODES.RESET));
  }

  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  destroy(): void {
    this.disconnect();
    if (this._manager) {
      this._manager.destroy();
      this._manager = null;
    }
  }
}

// Singleton — safe to import anywhere.
// Native module is only accessed the first time startScan() / connect() is called.
export const ftmsService = new FTMSService();
