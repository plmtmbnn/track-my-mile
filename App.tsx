import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  StatusBar,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { 
  Activity, Clock, Flame, MapPin, Zap, ChevronUp, Bluetooth, 
  Power, Trophy, Play, Pause, Square, Share2, RefreshCw, Download, Info
} from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  interpolate
} from 'react-native-reanimated';

import { useBLE } from './src/hooks/useBLE';
import { useWorkoutSession, SessionState } from './src/hooks/useWorkoutSession';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { useWorkoutStore } from './src/store/useWorkoutStore';

import GlassCard from './src/components/Dashboard/GlassCard';
import AnimatedMetric from './src/components/Dashboard/AnimatedMetric';
import ControlButton from './src/components/Dashboard/ControlButton';
import CombinedWorkoutChart from './src/components/Charts/CombinedWorkoutChart';
import DynamicBackground from './src/theme/DynamicBackground';
import StatusBanner from './src/components/Dashboard/StatusBanner';

import { generateGPX } from './src/utils/GPXGenerator';
import { FileService } from './src/services/FileService';
import { calculatePace } from './src/utils/WorkoutUtils';

const { width } = Dimensions.get('window');

const Dashboard = () => {
  const { palette } = useTheme();
  const { currentSessionPoints } = useWorkoutStore();
  const [lastSavedPath, setLastSavedPath] = useState<string | null>(null);

  const {
    scanForDevices,
    stopScan,
    allDevices,
    connectToDevice,
    connectedDevice,
    disconnectFromDevice,
    treadmillData,
    isScanning,
    isConnecting,
  } = useBLE();

  const { 
    state, 
    totalSeconds, 
    stats, 
    samples,
    startSession, 
    pauseSession, 
    resumeSession, 
    stopSession, 
    resetSession 
  } = useWorkoutSession(treadmillData, !!connectedDevice);

  // Parallax shared values
  const scrollY = useSharedValue(0);

  const totalDistanceKm = useMemo(() => (treadmillData?.totalDistance || 0) / 1000, [treadmillData?.totalDistance]);
  
  const avgPace = useMemo(() => {
    if (totalDistanceKm <= 0) return '00:00';
    const totalMinutes = (totalSeconds / 60) / totalDistanceKm;
    const mins = Math.floor(totalMinutes);
    const secs = Math.round((totalMinutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [totalSeconds, totalDistanceKm]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    try {
      const gpx = generateGPX(currentSessionPoints);
      const path = await FileService.saveWorkoutToGPX(gpx);
      setLastSavedPath(path);
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  const handleShare = async () => {
    try {
      const gpx = generateGPX(currentSessionPoints);
      const path = await FileService.saveWorkoutToGPX(gpx);
      await FileService.shareWorkoutFile(path);
    } catch (e) {
      console.error('Share failed', e);
    }
  };

  const speedValue = treadmillData?.speed || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <DynamicBackground speed={speedValue} />
      <StatusBanner />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: palette.text.primary }]}>Track My Mile</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: connectedDevice ? palette.accent.green : palette.accent.red }]} />
              <Text style={[styles.subtitle, { color: palette.text.secondary }]}>
                {connectedDevice ? connectedDevice.name : 'No Device Connected'}
              </Text>
            </View>
          </View>
          <GlassCard style={styles.connectionBadge}>
            <Bluetooth size={18} color={connectedDevice ? palette.accent.blue : palette.text.muted} />
          </GlassCard>
        </View>

        {!connectedDevice ? (
          <View style={styles.scanContainer}>
            <GlassCard style={styles.scanCard}>
              <Activity size={48} color={palette.accent.blue} style={styles.scanIcon} />
              <Text style={[styles.scanTitle, { color: palette.text.primary }]}>Ready to Run?</Text>
              <Text style={[styles.scanSubtitle, { color: palette.text.secondary }]}>Connect your treadmill to track metrics</Text>
              
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: palette.accent.blue }]} 
                onPress={isScanning ? stopScan : scanForDevices}
              >
                <Text style={styles.primaryButtonText}>{isScanning ? 'Stop Scanning' : 'Scan for Treadmill'}</Text>
              </TouchableOpacity>
            </GlassCard>

            <FlatList 
              data={allDevices} 
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => connectToDevice(item)}>
                  <GlassCard style={styles.deviceItem}>
                    <Bluetooth size={20} color={palette.accent.blue} />
                    <View style={styles.deviceInfo}>
                      <Text style={[styles.deviceName, { color: palette.text.primary }]}>{item.name || 'Unknown Device'}</Text>
                      <Text style={[styles.deviceId, { color: palette.text.muted }]}>{item.id}</Text>
                    </View>
                    {isConnecting && <Activity size={16} color={palette.accent.blue} />}
                  </GlassCard>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : (
          <ScrollView 
            style={styles.scroll} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Speed Display */}
            <GlassCard 
              style={styles.mainMetricCard}
              glowColor={speedValue > 8 ? palette.accent.orange : palette.accent.blue}
            >
              <AnimatedMetric 
                label="Current Speed" 
                value={speedValue.toFixed(1)} 
                unit="km/h" 
                size="large"
                intensity={speedValue}
              />
            </GlassCard>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              <GlassCard style={styles.smallMetricCard}>
                <AnimatedMetric label="Duration" value={formatTime(totalSeconds)} unit="" />
              </GlassCard>
              <GlassCard style={styles.smallMetricCard}>
                <AnimatedMetric label="Pace" value={avgPace} unit="min/km" />
              </GlassCard>
              <GlassCard style={styles.smallMetricCard}>
                <AnimatedMetric label="Distance" value={totalDistanceKm.toFixed(2)} unit="km" />
              </GlassCard>
              <GlassCard style={styles.smallMetricCard}>
                <AnimatedMetric label="Incline" value={(treadmillData?.incline || 0).toFixed(1)} unit="%" />
              </GlassCard>
            </View>

            {/* Chart */}
            <CombinedWorkoutChart data={samples} isLive={state !== SessionState.FINISHED} />

            {/* Controls */}
            <View style={styles.controlsRow}>
              {state === SessionState.RUNNING ? (
                <ControlButton 
                  label="Pause" 
                  icon={<Pause size={30} color="#FFF" />} 
                  color={palette.accent.orange} 
                  onPress={pauseSession} 
                />
              ) : (
                <ControlButton 
                  label={state === SessionState.PAUSED ? "Resume" : "Start"} 
                  icon={<Play size={30} color="#FFF" />} 
                  color={palette.accent.green} 
                  onPress={state === SessionState.PAUSED ? resumeSession : startSession} 
                />
              )}
              {state !== SessionState.IDLE && (
                <ControlButton 
                  label="Stop" 
                  icon={<Square size={24} color="#FFF" />} 
                  color={palette.accent.red} 
                  onPress={stopSession} 
                />
              )}
            </View>

            <TouchableOpacity onPress={disconnectFromDevice} style={styles.disconnectLink}>
              <Power size={14} color={palette.accent.red} />
              <Text style={[styles.disconnectText, { color: palette.accent.red }]}>Terminate Connection</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Summary Modal */}
      <Modal visible={state === SessionState.FINISHED} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <DynamicBackground speed={0} />
          <SafeAreaView style={styles.modalSafe}>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
              <Trophy size={80} color={palette.accent.orange} style={styles.modalIcon} />
              <Text style={[styles.modalTitle, { color: palette.text.primary }]}>Workout Summary</Text>
              
              <View style={styles.summaryGrid}>
                <SummaryItem label="Distance" value={totalDistanceKm.toFixed(2)} unit="km" />
                <SummaryItem label="Duration" value={formatTime(totalSeconds)} unit="" />
                <SummaryItem label="Avg Pace" value={avgPace} unit="min/km" />
                <SummaryItem label="Energy" value={treadmillData?.totalEnergy || 0} unit="kcal" />
              </View>

              <CombinedWorkoutChart data={samples} isLive={false} />

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: palette.accent.blue }]} onPress={handleDownload}>
                  <Download size={20} color="#FFF" />
                  <Text style={styles.actionBtnText}>Save GPX</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: palette.accent.green }]} onPress={handleShare}>
                  <Share2 size={20} color="#FFF" />
                  <Text style={styles.actionBtnText}>Share</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.newWorkoutBtn} onPress={resetSession}>
                <RefreshCw size={20} color={palette.text.primary} />
                <Text style={[styles.newWorkoutBtnText, { color: palette.text.primary }]}>New Workout</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const SummaryItem = ({ label, value, unit }: any) => {
  const { palette } = useTheme();
  return (
    <GlassCard style={styles.summaryCard}>
      <Text style={[styles.summaryLabel, { color: palette.text.secondary }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: palette.text.primary }]}>{value}</Text>
      {unit ? <Text style={[styles.summaryUnit, { color: palette.text.muted }]}>{unit}</Text> : null}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  title: { fontSize: 20, fontWeight: 'bold', fontFamily: 'VarelaRound-Regular' },
  subtitle: { fontSize: 12, fontWeight: '600' },
  connectionBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  scanContainer: { flex: 1, padding: 20 },
  scanCard: { padding: 40, alignItems: 'center', marginBottom: 30 },
  scanIcon: { marginBottom: 20 },
  scanTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, fontFamily: 'VarelaRound-Regular' },
  scanSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 30 },
  primaryButton: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, elevation: 10 },
  primaryButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  deviceItem: { padding: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center' },
  deviceInfo: { flex: 1, marginLeft: 15 },
  deviceName: { fontSize: 16, fontWeight: 'bold' },
  deviceId: { fontSize: 11 },
  mainMetricCard: { padding: 40, marginBottom: 20, alignItems: 'center' },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  smallMetricCard: { width: '48%', padding: 20, marginBottom: 16, alignItems: 'center' },
  controlsRow: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginVertical: 30 },
  disconnectLink: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', opacity: 0.8 },
  disconnectText: { fontSize: 12, fontWeight: 'bold', marginLeft: 8, textTransform: 'uppercase' },
  modalOverlay: { flex: 1 },
  modalSafe: { flex: 1 },
  modalScroll: { flex: 1 },
  modalContent: { padding: 30, alignItems: 'center' },
  modalIcon: { marginTop: 40, marginBottom: 20 },
  modalTitle: { fontSize: 32, fontWeight: 'bold', marginBottom: 40, fontFamily: 'VarelaRound-Regular' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  summaryCard: { width: '48%', padding: 20, marginBottom: 16, alignItems: 'center' },
  summaryLabel: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { fontSize: 22, fontWeight: 'bold' },
  summaryUnit: { fontSize: 10, marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: 15, marginVertical: 30 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, borderRadius: 20 },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  newWorkoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20 },
  newWorkoutBtnText: { fontWeight: 'bold', fontSize: 16 },
});

const App = () => (
  <ThemeProvider>
    <Dashboard />
  </ThemeProvider>
);

export default App;
