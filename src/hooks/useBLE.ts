import { useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { Device, Subscription } from 'react-native-ble-plx';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { bleService } from '../services/BLEService';
import { parseFTMSTreadmillData } from '../utils/FTMSParser';
import { useBLEStore } from '../store/useBLEStore';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();
const LAST_DEVICE_ID = 'last_device_id';

export const useBLE = () => {
  const {
    allDevices,
    connectedDevice,
    treadmillData,
    isScanning,
    isConnecting,
    addDevice,
    setAllDevices,
    setConnectedDevice,
    setTreadmillData,
    setIsScanning,
    setIsConnecting,
    reset
  } = useBLEStore();

  const subscriptionRef = useRef<Subscription | null>(null);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 31) {
        const result = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        const result2 = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
        const result3 = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        return result === RESULTS.GRANTED && result2 === RESULTS.GRANTED && result3 === RESULTS.GRANTED;
      }
      const result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      return result === RESULTS.GRANTED;
    }
    return true;
  };

  const scanForDevices = useCallback(async () => {
    const isGranted = await requestPermissions();
    if (!isGranted) return;

    setAllDevices([]);
    setIsScanning(true);
    bleService.scanDevices(device => {
      addDevice(device);
    });
  }, [setAllDevices, setIsScanning, addDevice]);

  const stopScan = useCallback(() => {
    bleService.stopScan();
    setIsScanning(false);
  }, [setIsScanning]);

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
          setTreadmillData(data);
        }
      });
      subscriptionRef.current = sub;
    } catch (e) {
      console.error('[useBLE] Failed to connect', e);
      setConnectedDevice(null);
    } finally {
      setIsConnecting(false);
    }
  }, [stopScan, setConnectedDevice, setIsConnecting, setTreadmillData]);

  const disconnectFromDevice = useCallback(async () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    await bleService.disconnect();
    reset();
    storage.delete(LAST_DEVICE_ID);
  }, [reset]);

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
