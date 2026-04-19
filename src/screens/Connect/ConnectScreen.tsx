import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useBLE } from '../../hooks/useBLE';
import { Bluetooth, Activity as ActivityIcon, ChevronRight } from 'lucide-react-native';
import { GlassCard } from '../../components/Dashboard/GlassCard';

export const ConnectScreen = ({ navigation }: any) => {
  const { palette } = useTheme();
  const {
    scanForDevices,
    stopScan,
    allDevices,
    connectToDevice,
    connectedDevice,
    isScanning,
    isConnecting,
  } = useBLE();

  // Auto-close on successful connection
  React.useEffect(() => {
    if (connectedDevice && !isConnecting) {
      const timer = setTimeout(() => {
        navigation.navigate('MainTabs', { screen: 'Home' });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [connectedDevice, isConnecting, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text.primary }]}>Connect</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} disabled={isConnecting}>
          <Text style={{ color: palette.accent.blue, fontWeight: 'bold', opacity: isConnecting ? 0.5 : 1 }}>Close</Text>
        </TouchableOpacity>
      </View>

      <GlassCard style={[styles.statusCard, connectedDevice && { borderColor: palette.accent.green }]}>
        <View style={styles.statusRow}>
          <Bluetooth size={24} color={connectedDevice ? palette.accent.green : palette.text.muted} />
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, { color: palette.text.secondary }]}>
              {isConnecting ? 'Establishing Connection...' : 'Status'}
            </Text>
            <Text style={[styles.statusValue, { color: connectedDevice ? palette.accent.green : '#FFF' }]}>
              {isConnecting ? 'Connecting...' : connectedDevice ? `Connected: ${connectedDevice.name || 'FTMS Treadmill'}` : 'Not Connected'}
            </Text>
          </View>
          {isConnecting && <ActivityIndicator size="small" color={palette.accent.blue} />}
        </View>
      </GlassCard>

      <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>Nearby Devices</Text>

      <FlatList
        data={allDevices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
          const isTarget = isConnecting && !connectedDevice; // Showing connecting state
          return (
            <TouchableOpacity 
              onPress={() => connectToDevice(item)}
              disabled={isConnecting || !!connectedDevice}
            >
              <GlassCard style={[styles.deviceItem, connectedDevice?.id === item.id && { backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}>
                <View style={styles.deviceInfo}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{item.name || 'Unknown Treadmill'}</Text>
                  <Text style={{ color: palette.text.muted, fontSize: 12 }}>{item.id}</Text>
                </View>
                {connectedDevice?.id === item.id ? (
                  <View style={{ backgroundColor: palette.accent.green, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: '#000', fontSize: 10, fontWeight: 'bold' }}>ACTIVE</Text>
                  </View>
                ) : (
                  <ChevronRight size={20} color={palette.text.muted} />
                )}
              </GlassCard>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <ActivityIcon size={48} color={palette.text.muted} style={{ marginBottom: 16 }} />
            <Text style={{ color: palette.text.muted }}>{isScanning ? 'Scanning for treadmills...' : 'No devices found'}</Text>
          </View>
        )}
      />

      <TouchableOpacity 
        style={[styles.scanButton, { backgroundColor: isScanning ? palette.accent.red : palette.accent.blue }]}
        onPress={isScanning ? stopScan : scanForDevices}
      >
        <Text style={styles.scanButtonText}>{isScanning ? 'Stop Scanning' : 'Scan for Treadmill'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '900' },
  statusCard: { marginHorizontal: 20, padding: 20, marginBottom: 30 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  statusInfo: { flex: 1 },
  statusLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  statusValue: { fontSize: 16, fontWeight: 'bold', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 20, marginBottom: 15 },
  deviceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, marginHorizontal: 20, marginBottom: 10 },
  deviceInfo: { gap: 4 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  scanButton: { height: 60, borderRadius: 20, margin: 20, alignItems: 'center', justifyContent: 'center' },
  scanButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
