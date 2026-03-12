/**
 * useFTMS Hook
 * Central state management for FTMS treadmill connection and control
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { State as BleState } from 'react-native-ble-plx';
import {
  FTMSState,
  ScannedDevice,
  TreadmillData,
  ConnectionStatus,
  MachineStatus,
  DEFAULT_TREADMILL_DATA,
  DEFAULT_SPEED_RANGE,
  DEFAULT_INCLINATION_RANGE,
} from '@/types/ftms';
import { ftmsService } from '@/services/ftmsService';

const INITIAL_STATE: FTMSState = {
  connectionStatus: 'disconnected',
  machineStatus: 'stopped',
  connectedDevice: null,
  treadmillData: { ...DEFAULT_TREADMILL_DATA },
  features: {},
  speedRange: DEFAULT_SPEED_RANGE,
  inclinationRange: DEFAULT_INCLINATION_RANGE,
  targetSpeed: 5.0,
  targetInclination: 0,
  error: null,
};

export function useFTMS() {
  const [state, setState] = useState<FTMSState>(INITIAL_STATE);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [bleReady, setBleReady] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const mountedRef = useRef(true);

  const updateState = useCallback((partial: Partial<FTMSState>) => {
    if (mountedRef.current) {
      setState(prev => ({ ...prev, ...partial }));
    }
  }, []);

  // ─── Initialize BLE ──────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;

    const init = async () => {
      // Guard: check native module before doing anything BLE-related
      if (!ftmsService.isBleSupported()) {
        Alert.alert(
          "Native Build Required",
          "BLE is not available. This app must be run as a native dev build.\n\nRun:\n  npx expo prebuild --clean\n  npx expo run:android",
        );
        return;
      }

      const granted = await ftmsService.requestPermissions();
      if (!granted) {
        Alert.alert(
          'Bluetooth Permission Required',
          'Please grant Bluetooth and Location permissions to use this app.',
        );
        return;
      }

      const bleState = await ftmsService.checkBluetoothState();
      if (bleState === BleState.PoweredOn) {
        setBleReady(true);
      } else {
        Alert.alert(
          'Bluetooth Disabled',
          'Please enable Bluetooth to connect to your treadmill.',
        );
      }
    };

    ftmsService.setCallbacks({
      onDataUpdate: (data: TreadmillData) => {
        updateState({ treadmillData: data });
      },
      onStatusChange: (status: string) => {
        if (status === 'connected') {
          updateState({ connectionStatus: 'connected', error: null });
        } else if (status === 'disconnected') {
          updateState({
            connectionStatus: 'disconnected',
            connectedDevice: null,
            machineStatus: 'stopped',
            treadmillData: { ...DEFAULT_TREADMILL_DATA },
          });
        } else if (status === 'scanning') {
          updateState({ connectionStatus: 'scanning', error: null });
        } else if (status === 'connecting') {
          updateState({ connectionStatus: 'connecting', error: null });
        } else if (status === 'error') {
          updateState({ connectionStatus: 'error' });
        }
      },
      onError: (error: string) => {
        updateState({ error });
      },
      onDevicesFound: (devices: ScannedDevice[]) => {
        setScannedDevices([...devices]);
      },
    });

    init();

    return () => {
      mountedRef.current = false;
    };
  }, [updateState]);

  // ─── Scan ────────────────────────────────────────────────────────────────────
  const startScan = useCallback(async () => {
    setScannedDevices([]);
    await ftmsService.startScan(15000);
  }, []);

  const stopScan = useCallback(() => {
    ftmsService.stopScan();
    updateState({ connectionStatus: 'disconnected' });
  }, [updateState]);

  // ─── Connect / Disconnect ────────────────────────────────────────────────────
  const connect = useCallback(async (device: ScannedDevice) => {
    updateState({ connectionStatus: 'connecting', connectedDevice: device, error: null });
    try {
      await ftmsService.connect(device.id);
    } catch (e: any) {
      updateState({ connectionStatus: 'error', error: e?.message ?? 'Connection failed' });
    }
  }, [updateState]);

  const disconnect = useCallback(async () => {
    await ftmsService.disconnect();
    updateState({
      connectionStatus: 'disconnected',
      connectedDevice: null,
      machineStatus: 'stopped',
      treadmillData: { ...DEFAULT_TREADMILL_DATA },
    });
  }, [updateState]);

  // ─── Machine Control ──────────────────────────────────────────────────────────
  const withSend = useCallback(async (action: () => Promise<void>) => {
    if (isSending) return;
    setIsSending(true);
    try {
      await action();
    } catch (e: any) {
      updateState({ error: e?.message ?? 'Command failed' });
    } finally {
      setIsSending(false);
    }
  }, [isSending, updateState]);

  const startMachine = useCallback(() => withSend(async () => {
    await ftmsService.startMachine();
    updateState({ machineStatus: 'started' });
  }), [withSend, updateState]);

  const stopMachine = useCallback(() => withSend(async () => {
    await ftmsService.stopMachine();
    updateState({ machineStatus: 'stopped' });
  }), [withSend, updateState]);

  const pauseMachine = useCallback(() => withSend(async () => {
    await ftmsService.pauseMachine();
    updateState({ machineStatus: 'paused' });
  }), [withSend, updateState]);

  const setTargetSpeed = useCallback((speed: number) => {
    updateState({ targetSpeed: speed });
  }, [updateState]);

  const setTargetInclination = useCallback((inclination: number) => {
    updateState({ targetInclination: inclination });
  }, [updateState]);

  const applySpeed = useCallback(() => withSend(async () => {
    await ftmsService.setSpeed(state.targetSpeed);
  }), [withSend, state.targetSpeed]);

  const applyInclination = useCallback(() => withSend(async () => {
    await ftmsService.setInclination(state.targetInclination);
  }), [withSend, state.targetInclination]);

  const quickSetSpeed = useCallback((speed: number) => withSend(async () => {
    updateState({ targetSpeed: speed });
    await ftmsService.setSpeed(speed);
  }), [withSend, updateState]);

  const incrementSpeed = useCallback((delta: number) => withSend(async () => {
    const newSpeed = Math.max(
      state.speedRange.minimum,
      Math.min(state.speedRange.maximum, state.targetSpeed + delta)
    );
    const rounded = Math.round(newSpeed * 10) / 10;
    updateState({ targetSpeed: rounded });
    await ftmsService.setSpeed(rounded);
  }), [withSend, state.targetSpeed, state.speedRange, updateState]);

  const incrementInclination = useCallback((delta: number) => withSend(async () => {
    const newInclination = Math.max(
      state.inclinationRange.minimum,
      Math.min(state.inclinationRange.maximum, state.targetInclination + delta)
    );
    const rounded = Math.round(newInclination * 10) / 10;
    updateState({ targetInclination: rounded });
    await ftmsService.setInclination(rounded);
  }), [withSend, state.targetInclination, state.inclinationRange, updateState]);

  return {
    // State
    ...state,
    scannedDevices,
    bleReady,
    isSending,
    isConnected: state.connectionStatus === 'connected',
    isRunning: state.machineStatus === 'started',
    isPaused: state.machineStatus === 'paused',

    // Actions
    startScan,
    stopScan,
    connect,
    disconnect,
    startMachine,
    stopMachine,
    pauseMachine,
    setTargetSpeed,
    setTargetInclination,
    applySpeed,
    applyInclination,
    quickSetSpeed,
    incrementSpeed,
    incrementInclination,
  };
}
