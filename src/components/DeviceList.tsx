import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  Text,
  Surface,
  Button,
  ActivityIndicator,
  List,
  Chip,
  Divider,
} from 'react-native-paper';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';
import type { ScannedDevice, ConnectionStatus } from '@/types/ftms';

interface DeviceListProps {
  devices: ScannedDevice[];
  connectionStatus: ConnectionStatus;
  connectedDevice: ScannedDevice | null;
  onScan: () => void;
  onStopScan: () => void;
  onConnect: (device: ScannedDevice) => void;
  onDisconnect: () => void;
}

function rssiToStrength(rssi: number | null): string {
  if (rssi === null) return 'weak';
  if (rssi > -60) return 'strong';
  if (rssi > -75) return 'medium';
  return 'weak';
}

function RssiChip({ rssi }: { rssi: number | null }) {
  const strength = rssiToStrength(rssi);
  const color =
    strength === 'strong'
      ? COLORS.success
      : strength === 'medium'
        ? COLORS.warning
        : COLORS.textMuted;
  const icon =
    strength === 'strong'
      ? 'signal-cellular-3'
      : strength === 'medium'
        ? 'signal-cellular-2'
        : 'signal-cellular-1';
  return (
    <Chip
      icon={icon}
      compact
      style={[styles.rssiChip, { borderColor: color }]}
      textStyle={{ color, fontSize: 10 }}
    >
      {rssi ?? '?'} dBm
    </Chip>
  );
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  connectionStatus,
  connectedDevice,
  onScan,
  onStopScan,
  onConnect,
  onDisconnect,
}) => {
  const isScanning = connectionStatus === 'scanning';
  const isConnecting = connectionStatus === 'connecting';
  const isConnected = connectionStatus === 'connected';

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.header} elevation={2}>
        <View style={styles.headerText}>
          <Text variant="titleMedium" style={styles.title}>
            FTMS Treadmill
          </Text>
          <Text variant="labelSmall" style={styles.subtitle}>
            Bluetooth LE Scanner
          </Text>
        </View>
        <View style={styles.headerAction}>
          {isConnected ? (
            <Button
              mode="contained"
              onPress={onDisconnect}
              buttonColor={COLORS.danger}
              textColor="#fff"
              compact
              icon="bluetooth-off"
            >
              Disconnect
            </Button>
          ) : isScanning ? (
            <Button
              mode="contained"
              onPress={onStopScan}
              buttonColor={COLORS.warning}
              textColor="#08090f"
              compact
              icon="stop"
            >
              Stop
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={onScan}
              buttonColor={COLORS.primary}
              textColor="#08090f"
              compact
              icon="bluetooth-search"
            >
              Scan
            </Button>
          )}
        </View>
      </Surface>

      {/* Status bar */}
      <View style={styles.statusBar}>
        {isScanning && (
          <>
            <ActivityIndicator size={14} color={COLORS.primary} />
            <Text style={[styles.statusText, { color: COLORS.primary }]}>
              Scanning for FTMS devices…
            </Text>
          </>
        )}
        {isConnecting && (
          <>
            <ActivityIndicator size={14} color={COLORS.warning} />
            <Text style={[styles.statusText, { color: COLORS.warning }]}>
              Connecting to {connectedDevice?.name}…
            </Text>
          </>
        )}
        {isConnected && (
          <>
            <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
            <Text style={[styles.statusText, { color: COLORS.success }]}>
              {connectedDevice?.name}
            </Text>
          </>
        )}
        {connectionStatus === 'disconnected' && devices.length === 0 && (
          <Text style={[styles.statusText, { color: COLORS.textMuted }]}>
            Tap Scan to find nearby FTMS treadmills
          </Text>
        )}
        {connectionStatus === 'error' && (
          <Text style={[styles.statusText, { color: COLORS.danger }]}>
            Connection failed. Try again.
          </Text>
        )}
      </View>

      <Divider style={{ backgroundColor: COLORS.border }} />

      {/* Device list */}
      {!isConnected && (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !isScanning ? (
              <View style={styles.emptyState}>
                <Text variant="bodyMedium" style={{ color: COLORS.textMuted }}>
                  No FTMS devices found
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <List.Item
              title={item.name ?? 'Unknown Device'}
              titleStyle={styles.deviceName}
              description={item.id}
              descriptionStyle={styles.deviceId}
              descriptionNumberOfLines={1}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon="run"
                  color={COLORS.primary}
                />
              )}
              right={() => (
                <View style={styles.deviceRight}>
                  <RssiChip rssi={item.rssi} />
                </View>
              )}
              onPress={() => onConnect(item)}
              disabled={isConnecting || isConnected}
              style={[
                styles.deviceItem,
                isConnecting &&
                  connectedDevice?.id === item.id &&
                  styles.deviceItemConnecting,
              ]}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgCard,
  },
  headerText: { flex: 1 },
  title: { color: COLORS.textPrimary, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, letterSpacing: 0.5 },
  headerAction: {},
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.bgCard,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '500' },
  list: { flex: 1 },
  listContent: { paddingVertical: SPACING.sm },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl },
  deviceItem: { backgroundColor: COLORS.bgCard },
  deviceItemConnecting: { backgroundColor: COLORS.warningGlow },
  deviceName: { color: COLORS.textPrimary, fontWeight: '700', fontSize: 14 },
  deviceId: { color: COLORS.textMuted, fontFamily: 'monospace', fontSize: 10 },
  deviceRight: { justifyContent: 'center', paddingRight: SPACING.sm },
  rssiChip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    height: 24,
  },
});
