import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

export const FTMS_SERVICE_UUID = '00001826-0000-1000-8000-00805f9b34fb';
export const TREADMILL_DATA_CHAR_UUID = '00002acd-0000-1000-8000-00805f9b34fb';

class BLEService {
  manager: BleManager;
  connectedDevice: Device | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  getManager() {
    return this.manager;
  }

  async scanDevices(onDeviceFound: (device: Device) => void) {
    this.manager.startDeviceScan([FTMS_SERVICE_UUID], null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        return;
      }
      if (device) {
        onDeviceFound(device);
      }
    });
  }

  stopScan() {
    this.manager.stopDeviceScan();
  }

  async connectToDevice(device: Device): Promise<Device> {
    try {
      const connectedDevice = await device.connect();
      this.connectedDevice = connectedDevice;
      await connectedDevice.discoverAllServicesAndCharacteristics();
      return connectedDevice;
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  async subscribeToTreadmillData(
    device: Device,
    onData: (characteristic: Characteristic | null) => void
  ) {
    return device.monitorCharacteristicForService(
      FTMS_SERVICE_UUID,
      TREADMILL_DATA_CHAR_UUID,
      (error, characteristic) => {
        if (error) {
          console.error('Subscription error:', error);
          return;
        }
        onData(characteristic);
      }
    );
  }

  async disconnect() {
    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
  }

  destroy() {
    this.manager.destroy();
  }
}

export const bleService = new BLEService();
