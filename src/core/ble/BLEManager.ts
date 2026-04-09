import { BleManager, Device, Subscription, Characteristic } from 'react-native-ble-plx';
import { BLEConnectionState, DeviceInfo } from '../types';

const FTMS_SERVICE_UUID = '00001826-0000-1000-8000-00805f9b34fb';
const TREADMILL_DATA_CHAR_UUID = '00002acd-0000-1000-8000-00805f9b34fb';

export class BLEManager {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private lastDeviceId: string | null = null;
  private connectionState: BLEConnectionState = BLEConnectionState.IDLE;
  private reconnectAttempt: number = 0;
  private maxReconnectAttempts: number = 5;
  private dataSubscription: Subscription | null = null;

  private onStateChange?: (state: BLEConnectionState) => void;
  private onDataReceived?: (base64Data: string) => void;

  constructor(onStateChange?: (state: BLEConnectionState) => void, onDataReceived?: (base64Data: string) => void) {
    this.manager = new BleManager();
    this.onStateChange = onStateChange;
    this.onDataReceived = onDataReceived;
    this.setupBluetoothStateListener();
  }

  private updateState(state: BLEConnectionState) {
    this.connectionState = state;
    this.onStateChange?.(state);
    console.log(`[BLEManager] State: ${state}`);
  }

  private setupBluetoothStateListener() {
    this.manager.onStateChange((state) => {
      if (state === 'PoweredOff') {
        this.handleDisconnect('Bluetooth Powered Off');
      } else if (state === 'PoweredOn' && this.lastDeviceId) {
        this.reconnect();
      }
    }, true);
  }

  public async connect(deviceId: string) {
    if (this.connectionState === BLEConnectionState.CONNECTING) return;
    
    this.lastDeviceId = deviceId;
    this.updateState(BLEConnectionState.CONNECTING);

    try {
      const device = await this.manager.connectToDevice(deviceId);
      this.connectedDevice = device;
      
      await device.discoverAllServicesAndCharacteristics();
      this.updateState(BLEConnectionState.CONNECTED);
      this.reconnectAttempt = 0;

      // Monitor disconnects
      device.onDisconnected((error) => {
        this.handleDisconnect(error?.message || 'Unexpected disconnect');
      });

      this.subscribeToData();
    } catch (error) {
      console.error('[BLEManager] Connection Error:', error);
      this.handleDisconnect('Connection Failed');
    }
  }

  private async subscribeToData() {
    if (!this.connectedDevice) return;
    
    // Safety: cleanup old subscription
    this.cleanupSubscription();

    this.dataSubscription = this.connectedDevice.monitorCharacteristicForService(
      FTMS_SERVICE_UUID,
      TREADMILL_DATA_CHAR_UUID,
      (error, char) => {
        if (error) {
          console.error('[BLEManager] Subscription Error:', error);
          this.handleDisconnect('Subscription Error');
          return;
        }
        if (char?.value) {
          this.onDataReceived?.(char.value);
        }
      }
    );
  }

  private handleDisconnect(reason: string) {
    console.log(`[BLEManager] Disconnected: ${reason}`);
    this.cleanupSubscription();
    this.connectedDevice = null;

    if (this.lastDeviceId && this.reconnectAttempt < this.maxReconnectAttempts) {
      this.updateState(BLEConnectionState.RECONNECTING);
      this.scheduleReconnect();
    } else {
      this.updateState(BLEConnectionState.DISCONNECTED);
    }
  }

  private scheduleReconnect() {
    const backoff = Math.pow(2, this.reconnectAttempt) * 1000;
    console.log(`[BLEManager] Scheduling reconnect in ${backoff}ms (Attempt ${this.reconnectAttempt + 1})`);
    
    setTimeout(() => {
      if (this.lastDeviceId) {
        this.reconnectAttempt++;
        this.connect(this.lastDeviceId);
      }
    }, backoff);
  }

  private async reconnect() {
    if (this.lastDeviceId) {
      await this.connect(this.lastDeviceId);
    }
  }

  public async disconnect() {
    this.lastDeviceId = null; // Prevent auto-reconnect
    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection();
    }
    this.cleanupSubscription();
    this.updateState(BLEConnectionState.IDLE);
  }

  private cleanupSubscription() {
    if (this.dataSubscription) {
      this.dataSubscription.remove();
      this.dataSubscription = null;
    }
  }

  public destroy() {
    this.disconnect();
    this.manager.destroy();
  }
}
