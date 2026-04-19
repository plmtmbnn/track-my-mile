import { create } from 'zustand';
import { Device } from 'react-native-ble-plx';
import { TreadmillData } from '../utils/FTMSParser';

interface BLEState {
  allDevices: Device[];
  connectedDevice: Device | null;
  treadmillData: TreadmillData | null;
  isScanning: boolean;
  isConnecting: boolean;
  
  setAllDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  setConnectedDevice: (device: Device | null) => void;
  setTreadmillData: (data: TreadmillData | null) => void;
  setIsScanning: (isScanning: boolean) => void;
  setIsConnecting: (isConnecting: boolean) => void;
  reset: () => void;
}

export const useBLEStore = create<BLEState>((set) => ({
  allDevices: [],
  connectedDevice: null,
  treadmillData: null,
  isScanning: false,
  isConnecting: false,

  setAllDevices: (allDevices) => set({ allDevices }),
  addDevice: (device) => set((state) => {
    if (state.allDevices.some(d => d.id === device.id)) return state;
    return { allDevices: [...state.allDevices, device] };
  }),
  setConnectedDevice: (connectedDevice) => set({ connectedDevice }),
  setTreadmillData: (data) => set((state) => ({
    treadmillData: state.treadmillData ? { ...state.treadmillData, ...data } : data
  })),
  setIsScanning: (isScanning) => set({ isScanning }),
  setIsConnecting: (isConnecting) => set({ isConnecting }),
  reset: () => set({ 
    allDevices: [], 
    connectedDevice: null, 
    treadmillData: null, 
    isScanning: false, 
    isConnecting: false 
  }),
}));
