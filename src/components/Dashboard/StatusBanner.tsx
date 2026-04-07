import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, Platform } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { BluetoothOff, AlertCircle, ShieldAlert } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { bleService } from '../../services/BLEService';

export type BLEState = 'Unknown' | 'Resetting' | 'Unsupported' | 'Unauthorized' | 'PoweredOff' | 'PoweredOn';

const StatusBanner = () => {
  const { palette } = useTheme();
  const [bleState, setBleState] = useState<BLEState>('Unknown');

  useEffect(() => {
    const subscription = bleService.getManager().onStateChange((state: string) => {
      setBleState(state as BLEState);
    }, true);
    return () => subscription.remove();
  }, []);

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('App-Prefs:Bluetooth');
    } else {
      Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
    }
  };

  const getStatusConfig = () => {
    switch (bleState) {
      case 'PoweredOff':
        return {
          icon: <BluetoothOff size={20} color="#FFF" />,
          text: 'Bluetooth is turned off.',
          action: 'Enable',
          color: palette.accent.red,
        };
      case 'Unauthorized':
        return {
          icon: <ShieldAlert size={20} color="#FFF" />,
          text: 'Bluetooth permission missing.',
          action: 'Settings',
          color: palette.accent.orange,
        };
      case 'Unsupported':
        return {
          icon: <AlertCircle size={20} color="#FFF" />,
          text: 'BLE not supported on this device.',
          color: palette.accent.red,
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  return (
    <AnimatePresence>
      {config && (
        <MotiView
          from={{ translateY: -100, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          exit={{ translateY: -100, opacity: 0 }}
          style={[styles.banner, { backgroundColor: config.color }]}
        >
          <View style={styles.content}>
            {config.icon}
            <Text style={styles.text}>{config.text}</Text>
          </View>
          {config.action && (
            <TouchableOpacity onPress={openSettings} style={styles.button}>
              <Text style={styles.buttonText}>{config.action}</Text>
            </TouchableOpacity>
          )}
        </MotiView>
      )}
    </AnimatePresence>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default StatusBanner;
