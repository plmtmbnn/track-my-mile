import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { Device, Subscription } from 'react-native-ble-plx';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { bleService } from '../services/BLEService';
import { parseFTMSTreadmillData, TreadmillData } from '../utils/FTMSParser';
import { createMMKV } from 'react-native-mmkv';
const storage = createMMKV();
const LAST_DEVICE_ID = 'last_device_id';

export const useBLE = () => {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [treadmillData, setTreadmillData] = useState<TreadmillData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const subscriptionRef = useRef<Subscription | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const result = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        const result2 = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
        const result3 = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        return (
          result === RESULTS.GRANTED &&
          result2 === RESULTS.GRANTED &&
          result3 === RESULTS.GRANTED
        );
      } else {
        const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        return result === RESULTS.GRANTED;
      }
    }
    return true;
  };

  const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex(device => nextDevice.id === device.id) > -1;

  const scanForDevices = useCallback(async () => {
    const isGranted = await requestPermissions();
    if (!isGranted) {
      console.warn('Permissions not granted');
      return;
    }

    setAllDevices([]);
    setIsScanning(true);
    bleService.scanDevices(device => {
      setAllDevices(prevState => {
        if (!isDuplicateDevice(prevState, device)) {
          return [...prevState, device];
        }
        return prevState;
      });
    });
  }, []);

  const stopScan = useCallback(() => {
    bleService.stopScan();
    setIsScanning(false);
  }, []);

  const connectToDevice = useCallback(async (device: Device) => {
    try {
      setIsConnecting(true);
      stopScan();
      const connected = await bleService.connectToDevice(device);
      setConnectedDevice(connected);
      storage.set(LAST_DEVICE_ID, connected.id);
      
      const sub = await bleService.subscribeToTreadmillData(connected, characteristic => {
        if (characteristic?.value) {
          const data = parseFTMSTreadmillData(characteristic.value);
          setTreadmillData(prev => ({ ...prev, ...data }));
        }
      });
      subscriptionRef.current = sub;
    } catch (e) {
      console.error('Failed to connect', e);
    } finally {
      setIsConnecting(false);
    }
  }, [stopScan]);

  const disconnectFromDevice = useCallback(async () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    await bleService.disconnect();
    setConnectedDevice(null);
    setTreadmillData(null);
    storage.remove(LAST_DEVICE_ID);
  }, []);

  // Auto-reconnect logic
  useEffect(() => {
    const lastId = storage.getString(LAST_DEVICE_ID);
    if (lastId && !connectedDevice) {
      console.log('Attempting auto-reconnect to:', lastId);
      // Logic would go here to scan specifically for this ID or use cached device
    }
  }, []);

  useEffect(() => {
    const subscription = bleService.getManager().onStateChange(state => {
      if (state === 'PoweredOn') {
        scanForDevices();
      }
    }, true);

    return () => {
      subscription.remove();
      bleService.stopScan();
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, [scanForDevices]);

  return {
    scanForDevices,
    stopScan,
    allDevices,
    connectToDevice,
    connectedDevice,
    disconnectFromDevice,
    treadmillData,
    isScanning,
    isConnecting,
  };
};
