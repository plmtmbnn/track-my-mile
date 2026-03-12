import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, Button, Chip, Divider, IconButton } from 'react-native-paper';
import { useFTMS } from '@/hooks/useFTMS';
import { SpeedGauge } from '@/components/SpeedGauge';
import { MetricCard } from '@/components/MetricCard';
import { SpeedControl } from '@/components/SpeedControl';
import { InclinationControl } from '@/components/InclinationControl';
import { ControlButton } from '@/components/ControlButton';
import { DeviceList } from '@/components/DeviceList';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';
import { formatTime, formatDistance, formatPace } from '@/services/ftmsParser';
import type { ConnectionStatus } from '@/types/ftms';

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { label: string; color: string; icon: string }
> = {
  disconnected: { label: 'Disconnected', color: COLORS.textMuted, icon: 'bluetooth-off' },
  scanning: { label: 'Scanning…', color: COLORS.primary, icon: 'bluetooth-search' },
  connecting: { label: 'Connecting…', color: COLORS.warning, icon: 'bluetooth-connect' },
  connected: { label: 'Connected', color: COLORS.success, icon: 'bluetooth-connect' },
  error: { label: 'Error', color: COLORS.danger, icon: 'alert-circle' },
};

function StatusChip({ status }: { status: ConnectionStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Chip
      icon={cfg.icon}
      style={[styles.statusChip, { borderColor: `${cfg.color}44` }]}
      textStyle={{ color: cfg.color, fontSize: 11, fontWeight: '700' }}
      compact
    >
      {cfg.label}
    </Chip>
  );
}

export default function DashboardScreen() {
  const ftms = useFTMS();

  const {
    connectionStatus,
    machineStatus,
    connectedDevice,
    treadmillData,
    scannedDevices,
    isConnected,
    isRunning,
    isPaused,
    targetSpeed,
    targetInclination,
    speedRange,
    inclinationRange,
    isSending,
  } = ftms;

  return (
    <View style={styles.root}>
      {/* ── Top Bar ────────────────────────────────── */}
      <Surface style={styles.topBar} elevation={2}>
        <View style={styles.topBarLeft}>
          <Text variant="titleMedium" style={styles.appName}>
            ⚡ FTMS
          </Text>
          <Text variant="labelSmall" style={styles.appSub}>
            Treadmill Controller
          </Text>
        </View>

        <StatusChip status={connectionStatus} />

        {isConnected && (
          <View style={styles.topBarRight}>
            <Text variant="labelSmall" style={styles.deviceName} numberOfLines={1}>
              {connectedDevice?.name}
            </Text>
            <Button
              mode="text"
              onPress={ftms.disconnect}
              textColor={COLORS.danger}
              compact
              labelStyle={{ fontSize: 11 }}
            >
              Disconnect
            </Button>
          </View>
        )}
      </Surface>

      {/* ── Body ───────────────────────────────────── */}
      <View style={styles.body}>
        {/* LEFT PANEL */}
        <View style={styles.leftPanel}>
          {!isConnected ? (
            <DeviceList
              devices={scannedDevices}
              connectionStatus={connectionStatus}
              connectedDevice={connectedDevice}
              onScan={ftms.startScan}
              onStopScan={ftms.stopScan}
              onConnect={ftms.connect}
              onDisconnect={ftms.disconnect}
            />
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.controlsScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Machine controls */}
              <View style={styles.machineControls}>
                {!isRunning && !isPaused && (
                  <ControlButton
                    label="START"
                    onPress={ftms.startMachine}
                    variant="success"
                    size="lg"
                    loading={isSending}
                    icon="play"
                    style={styles.fullBtn}
                  />
                )}
                {isRunning && (
                  <>
                    <ControlButton
                      label="PAUSE"
                      onPress={ftms.pauseMachine}
                      variant="warning"
                      size="md"
                      loading={isSending}
                      icon="pause"
                      style={styles.halfBtn}
                    />
                    <ControlButton
                      label="STOP"
                      onPress={ftms.stopMachine}
                      variant="danger"
                      size="md"
                      loading={isSending}
                      icon="stop"
                      style={styles.halfBtn}
                    />
                  </>
                )}
                {isPaused && (
                  <>
                    <ControlButton
                      label="RESUME"
                      onPress={ftms.startMachine}
                      variant="success"
                      size="md"
                      loading={isSending}
                      icon="play"
                      style={styles.halfBtn}
                    />
                    <ControlButton
                      label="STOP"
                      onPress={ftms.stopMachine}
                      variant="danger"
                      size="md"
                      loading={isSending}
                      icon="stop"
                      style={styles.halfBtn}
                    />
                  </>
                )}
              </View>

              <SpeedControl
                targetSpeed={targetSpeed}
                currentSpeed={treadmillData.instantaneousSpeed}
                minSpeed={speedRange.minimum}
                maxSpeed={speedRange.maximum}
                onIncrement={ftms.incrementSpeed}
                onQuickSet={ftms.quickSetSpeed}
                disabled={!isRunning && !isPaused}
              />

              <InclinationControl
                targetInclination={targetInclination}
                currentInclination={treadmillData.inclination}
                minInclination={inclinationRange.minimum}
                maxInclination={inclinationRange.maximum}
                onIncrement={ftms.incrementInclination}
                disabled={!isRunning && !isPaused}
              />
            </ScrollView>
          )}
        </View>

        <Divider style={styles.divider} />

        {/* RIGHT PANEL */}
        <View style={styles.rightPanel}>
          {isConnected ? (
            <>
              {/* Gauge + hero metrics */}
              <View style={styles.gaugeRow}>
                <SpeedGauge
                  speed={treadmillData.instantaneousSpeed}
                  maxSpeed={speedRange.maximum || 20}
                  targetSpeed={isRunning ? targetSpeed : undefined}
                  size={160}
                />
                <View style={styles.heroMetrics}>
                  <MetricCard
                    label="Elapsed"
                    value={formatTime(treadmillData.elapsedTime)}
                    accent={COLORS.primary}
                    large
                  />
                  <MetricCard
                    label="Distance"
                    value={formatDistance(treadmillData.totalDistance)}
                    accent={COLORS.success}
                  />
                  <MetricCard
                    label="Incline"
                    value={`${treadmillData.inclination >= 0 ? '+' : ''}${treadmillData.inclination.toFixed(1)}`}
                    unit="%"
                    accent={treadmillData.inclination > 0 ? COLORS.warning : COLORS.primary}
                  />
                </View>
              </View>

              {/* Secondary metrics */}
              <View style={styles.metricsGrid}>
                {[
                  {
                    label: 'Pace',
                    value: formatPace(treadmillData.instantaneousPace),
                    unit: 'min/km',
                    accent: COLORS.primary,
                  },
                  {
                    label: 'Calories',
                    value: `${treadmillData.expendedEnergy}`,
                    unit: 'kcal',
                    accent: COLORS.danger,
                  },
                  {
                    label: 'Heart Rate',
                    value: treadmillData.heartRate > 0 ? `${treadmillData.heartRate}` : '--',
                    unit: 'bpm',
                    accent: COLORS.danger,
                  },
                  {
                    label: 'MET',
                    value:
                      treadmillData.metabolicEquivalent > 0
                        ? treadmillData.metabolicEquivalent.toFixed(1)
                        : '--',
                    accent: COLORS.success,
                  },
                  {
                    label: 'Avg Speed',
                    value: treadmillData.averageSpeed.toFixed(1),
                    unit: 'km/h',
                    accent: COLORS.primaryDim,
                  },
                  {
                    label: 'Cal/min',
                    value: `${treadmillData.energyPerMinute}`,
                    accent: COLORS.warning,
                  },
                ].map((m) => (
                  <MetricCard
                    key={m.label}
                    label={m.label}
                    value={m.value}
                    unit={m.unit}
                    accent={m.accent}
                    style={styles.metricGridItem}
                  />
                ))}
              </View>

              {/* Machine status chip */}
              <Chip
                icon={isRunning ? 'pulse' : isPaused ? 'pause-circle' : 'stop-circle'}
                style={[
                  styles.machineStatusChip,
                  isRunning && { backgroundColor: COLORS.successGlow },
                  isPaused && { backgroundColor: COLORS.warningGlow },
                ]}
                textStyle={{
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 2,
                  color: isRunning
                    ? COLORS.success
                    : isPaused
                      ? COLORS.warning
                      : COLORS.textMuted,
                }}
                compact
              >
                {isRunning ? 'RUNNING' : isPaused ? 'PAUSED' : 'STOPPED'}
              </Chip>
            </>
          ) : (
            <View style={styles.notConnected}>
              <IconButton
                icon="run"
                size={48}
                iconColor={COLORS.textMuted}
                style={styles.notConnectedIcon}
              />
              <Text variant="titleMedium" style={styles.notConnectedTitle}>
                No Treadmill Connected
              </Text>
              <Text variant="bodySmall" style={styles.notConnectedSub}>
                Scan and connect to an FTMS-compatible treadmill to see live metrics.
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.bgCard,
    gap: SPACING.md,
  },
  topBarLeft: { marginRight: 'auto' as unknown as number },
  appName: { color: COLORS.primary, fontWeight: '900', letterSpacing: -0.5 },
  appSub: { color: COLORS.textMuted, letterSpacing: 2 },
  topBarRight: { alignItems: 'flex-end' },
  deviceName: { color: COLORS.textSecondary, maxWidth: 180 },
  statusChip: { backgroundColor: COLORS.bgCard, borderWidth: 1 },

  body: { flex: 1, flexDirection: 'row' },
  leftPanel: { width: '42%' },
  divider: { width: 1, height: '100%', backgroundColor: COLORS.border },
  rightPanel: { flex: 1, padding: SPACING.md, gap: SPACING.sm },

  controlsScroll: { padding: SPACING.md, gap: SPACING.md },
  machineControls: { flexDirection: 'row', gap: SPACING.sm },
  fullBtn: { flex: 1 },
  halfBtn: { flex: 1 },

  gaugeRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  heroMetrics: { flex: 1, gap: SPACING.sm },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  metricGridItem: { flex: 1, minWidth: 80 },

  machineStatusChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  notConnected: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  notConnectedIcon: {
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notConnectedTitle: { color: COLORS.textSecondary, textAlign: 'center', fontWeight: '800' },
  notConnectedSub: { color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
});
