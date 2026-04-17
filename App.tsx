import React, { useState, useMemo, useEffect } from 'react';
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
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { 
  Activity, Clock, Flame, MapPin, Zap, ChevronUp, Bluetooth, 
  Power, Trophy, Play, Pause, Square, Share2, RefreshCw, Download, Info,
  Settings, TrendingUp, Timer
} from 'lucide-react-native';
import Animated, { 
  FadeIn, 
  FadeOut,
  Layout,
  SlideInUp,
  SlideOutDown
} from 'react-native-reanimated';

import { useBLE } from './src/hooks/useBLE';
import { useWorkoutSession, SessionState } from './src/hooks/useWorkoutSession';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { useWorkoutStore } from './src/store/useWorkoutStore';
import { useGoalTracking } from './src/hooks/useGoalTracking';
import { useUIStore } from './src/store/useUIStore';
import { useAdvancedWorkoutStore } from './src/store/useAdvancedWorkoutStore';
import { AdvancedWorkoutEngine } from './src/core/control/advanced-workout/AdvancedWorkoutEngine';

import { GlassCard } from './src/components/Dashboard/GlassCard';
import { AnimatedMetric } from './src/components/Dashboard/AnimatedMetric';
import ControlButton from './src/components/Dashboard/ControlButton';
import CombinedWorkoutChart from './src/components/Charts/CombinedWorkoutChart';
import DynamicBackground from './src/theme/DynamicBackground';
import { StatusBanner } from './src/components/Dashboard/StatusBanner';

import { generateGPX } from './src/utils/GPXGenerator';
import { FileService } from './src/services/FileService';

const { width, height } = Dimensions.get('window');

const Dashboard = () => {
  const { palette } = useTheme();
  const { currentSessionPoints } = useWorkoutStore();
  const { isFocusMode } = useUIStore();
  
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
    processedMetrics,
    samples,
    startSession, 
    pauseSession, 
    resumeSession, 
    stopSession, 
    resetSession 
  } = useWorkoutSession(treadmillData, !!connectedDevice);

  const { status, deltaMeters } = useGoalTracking(processedMetrics?.distance || 0, totalSeconds);

  // Advanced Workout Engine Integration
  const { activePlanId, savedPlans, currentIndex, setCurrentIndex } = useAdvancedWorkoutStore();
  const engineRef = React.useRef<AdvancedWorkoutEngine | null>(null);
  const lastDistanceRef = React.useRef(0);

  useEffect(() => {
    // Initialize/Start Engine
    if (state === SessionState.RUNNING && activePlanId && !engineRef.current) {
      const plan = savedPlans.find(p => p.id === activePlanId);
      if (plan) {
        engineRef.current = new AdvancedWorkoutEngine(plan, (idx) => {
          setCurrentIndex(idx);
        });
        engineRef.current.start(currentIndex);
        lastDistanceRef.current = processedMetrics?.distance || 0;
      }
    } 
    // Clear Engine when not in workout
    else if (state !== SessionState.RUNNING && state !== SessionState.PAUSED) {
      engineRef.current = null;
    }
  }, [state, activePlanId, savedPlans, currentIndex, setCurrentIndex]);

  // Tick Engine
  useEffect(() => {
    if (state === SessionState.RUNNING && engineRef.current && processedMetrics) {
      const currentDistance = processedMetrics.distance;
      const deltaDistance = currentDistance - lastDistanceRef.current;
      lastDistanceRef.current = currentDistance;
      
      engineRef.current.tick(1, deltaDistance, treadmillData?.speed || 0);
    }
  }, [processedMetrics?.timestamp, state]);

  // Permission Check on Launch
  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'android') {
        const bluetoothStatus = await check(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        const locationStatus = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);

        if (bluetoothStatus !== RESULTS.GRANTED || locationStatus !== RESULTS.GRANTED) {
          Alert.alert(
            'Permissions Required',
            'Bluetooth and Location are required to connect to your treadmill.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
        }
      }
    };
    checkPermissions();
  }, []);

  const handleSaveGPX = async () => {
    try {
      const gpx = generateGPX(currentSessionPoints);
      await FileService.saveWorkoutToGPX(gpx);
      stopSession(); // Save session to history and clear
      Alert.alert('Success', 'Workout saved to your documents.');
    } catch (e) {
      console.error('Save failed', e);
      Alert.alert('Error', 'Failed to save workout.');
    }
  };

  const handleShare = async () => {
    try {
      const gpx = generateGPX(currentSessionPoints);
      const path = await FileService.saveWorkoutToGPX(gpx);
      await FileService.shareWorkoutFile(path);
    } catch (e) {
      console.error('Share failed', e);
      Alert.alert('Error', 'Failed to share workout.');
    }
  };

  const handleTerminate = async () => {
    await disconnectFromDevice();
    resetSession();
  };

  const speedValue = treadmillData?.speed || 0;
  const isRunning = state === SessionState.RUNNING || state === SessionState.PAUSED;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDistanceKm = (processedMetrics?.distance || 0) / 1000;
  const currentPace = speedValue > 0 ? (60 / speedValue).toFixed(2) : "0.00";
  const avgPace = totalDistanceKm > 0 ? (totalSeconds / 60 / totalDistanceKm).toFixed(2) : "0.00";
  const calories = processedMetrics?.calories || 0;
  const maxSpeed = samples.length > 0 ? Math.max(...samples.map(s => s.speed)) : 0;

  // Effort Indicator Logic
  const getEffortLabel = () => {
    if (speedValue === 0) return "IDLE";
    if (speedValue < 6) return "WARMUP";
    if (speedValue < 10) return "AEROBIC";
    if (speedValue < 14) return "THRESHOLD";
    return "ANAEROBIC";
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <DynamicBackground speed={speedValue} />
      
      {/* Dynamic Status Header */}
      <StatusBanner goalStatus={status} deltaMeters={deltaMeters} />

      <SafeAreaView style={styles.safeArea}>
        {!connectedDevice ? (
          // --- IDLE / SCANNING VIEW ---
          <Animated.View 
            entering={FadeIn} 
            exiting={FadeOut}
            style={styles.idleContainer}
          >
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Track My Mile</Text>
              <Text style={styles.heroSubtitle}>Precision Treadmill Control</Text>
            </View>

            <GlassCard style={styles.scanCard}>
              <View style={styles.scanHeader}>
                <Activity size={32} color={palette.accent.blue} />
                <Text style={styles.scanTitle}>Available Treadmills</Text>
              </View>

              <FlatList 
                data={allDevices} 
                style={styles.deviceList}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => connectToDevice(item)} style={styles.deviceButton}>
                    <View style={styles.deviceIcon}>
                      <Bluetooth size={18} color="#FFF" />
                    </View>
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>{item.name || 'FTMS Treadmill'}</Text>
                      <Text style={styles.deviceId}>{item.id}</Text>
                    </View>
                    {isConnecting && <Activity size={16} color={palette.accent.blue} />}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyText}>
                    {isScanning ? 'Looking for equipment...' : 'No devices found'}
                  </Text>
                )}
              />

              <TouchableOpacity 
                style={[styles.scanAction, { backgroundColor: isScanning ? palette.accent.red : palette.accent.blue }]} 
                onPress={isScanning ? stopScan : scanForDevices}
              >
                <Text style={styles.scanActionText}>{isScanning ? 'Stop' : 'Scan'}</Text>
              </TouchableOpacity>
            </GlassCard>
          </Animated.View>
        ) : (
          // --- ACTIVE RUNNING VIEW ---
          <>
          <ScrollView 
            style={styles.runningScroll} 
            contentContainerStyle={styles.runningContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Main Metric Focus (Speed) */}
            <View style={styles.speedFocus}>
              <Text style={styles.metricLabel}>{getEffortLabel()}</Text>
              <View style={styles.speedValueRow}>
                <Text style={styles.speedValue}>{speedValue.toFixed(1)}</Text>
                <Text style={styles.speedUnit}>km/h</Text>
              </View>
            </View>

            {/* Main Metrics Dock */}
            <View style={styles.metricsDock}>
              <View style={styles.dockItem}>
                <Timer size={18} color={palette.accent.blue} />
                <Text style={styles.dockValue}>{formatTime(totalSeconds)}</Text>
                <Text style={styles.dockLabel}>TIME</Text>
              </View>
              <View style={styles.dockItem}>
                <TrendingUp size={18} color={palette.accent.green} />
                <Text style={styles.dockValue}>{currentPace}</Text>
                <Text style={styles.dockLabel}>PACE</Text>
              </View>
              <View style={styles.dockItem}>
                <MapPin size={18} color={palette.accent.purple} />
                <Text style={styles.dockValue}>{totalDistanceKm.toFixed(2)}</Text>
                <Text style={styles.dockLabel}>KM</Text>
              </View>
            </View>

            {/* secondary metrics */}
            <View style={[styles.metricsDock, { marginTop: 15, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
              <View style={styles.dockItem}>
                <Text style={[styles.dockValue, { fontSize: 14 }]}>{avgPace}</Text>
                <Text style={styles.dockLabel}>AVG PACE</Text>
              </View>
              <View style={styles.dockItem}>
                <Text style={[styles.dockValue, { fontSize: 14 }]}>{maxSpeed.toFixed(1)}</Text>
                <Text style={styles.dockLabel}>MAX SPD</Text>
              </View>
              <View style={styles.dockItem}>
                <Flame size={14} color={palette.accent.red} />
                <Text style={[styles.dockValue, { fontSize: 14 }]}>{calories}</Text>
                <Text style={styles.dockLabel}>KCAL</Text>
              </View>
              <View style={styles.dockItem}>
                <ChevronUp size={14} color={palette.accent.orange} />
                <Text style={[styles.dockValue, { fontSize: 14 }]}>{(treadmillData?.incline || 0).toFixed(1)}</Text>
                <Text style={styles.dockLabel}>INC %</Text>
              </View>
            </View>

            {/* Performance Visualizer (Chart) */}
            <View style={styles.chartWrapper}>
              <CombinedWorkoutChart data={samples} isLive={state !== SessionState.FINISHED} />
            </View>

            {/* Safety Disconnect */}
            {!isRunning && (
              <TouchableOpacity onPress={handleTerminate} style={styles.terminalBtn}>
                <Power size={14} color={palette.accent.red} />
                <Text style={styles.terminalText}>TERMINATE CONNECTION</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Huge Tactile Controls - Moved Outside ScrollView for fixed positioning */}
          <View style={[styles.actionControls, { paddingHorizontal: 20, backgroundColor: 'transparent' }]}>
            {state === SessionState.IDLE ? (
              <TouchableOpacity style={[styles.bigButton, { backgroundColor: palette.accent.green }]} onPress={startSession}>
                <Play size={40} color="#000" fill="#000" />
                <Text style={styles.bigButtonText}>START</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.activeControlsRow}>
                <TouchableOpacity 
                  style={[styles.bigButton, { backgroundColor: palette.accent.orange, flex: 2 }]} 
                  onPress={state === SessionState.RUNNING ? pauseSession : resumeSession}
                >
                  {state === SessionState.RUNNING ? <Pause size={32} color="#000" fill="#000" /> : <Play size={32} color="#000" fill="#000" />}
                  <Text style={styles.bigButtonText}>{state === SessionState.RUNNING ? 'PAUSE' : 'RESUME'}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.bigButton, { backgroundColor: palette.accent.red, flex: 1 }]} 
                  onPress={stopSession}
                >
                  <Square size={24} color="#FFF" fill="#FFF" />
                  <Text style={[styles.bigButtonText, { color: '#FFF' }]}>STOP</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
        )}
      </SafeAreaView>

      {/* Summary Screen Redesign */}
      <Modal visible={state === SessionState.FINISHED} transparent animationType="slide">
        <View style={styles.summaryOverlay}>
          <DynamicBackground speed={0} />
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.summaryScroll}>
              <Trophy size={64} color={palette.accent.orange} style={styles.trophyIcon} />
              <Text style={styles.summaryTitle}>Run Complete</Text>
              
              <View style={styles.summaryGrid}>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryVal}>{totalDistanceKm.toFixed(2)}</Text>
                  <Text style={styles.summaryLab}>TOTAL KM</Text>
                </View>
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryVal}>{formatTime(totalSeconds)}</Text>
                  <Text style={styles.summaryLab}>DURATION</Text>
                </View>
              </View>

              <View style={styles.summaryGrid}>
                <View style={[styles.summaryBox, { padding: 15 }]}>
                  <Text style={[styles.summaryVal, { fontSize: 20 }]}>{avgPace}</Text>
                  <Text style={styles.summaryLab}>AVG PACE</Text>
                </View>
                <View style={[styles.summaryBox, { padding: 15 }]}>
                  <Text style={[styles.summaryVal, { fontSize: 20 }]}>{maxSpeed.toFixed(1)}</Text>
                  <Text style={styles.summaryLab}>MAX SPEED</Text>
                </View>
                <View style={[styles.summaryBox, { padding: 15 }]}>
                  <Text style={[styles.summaryVal, { fontSize: 20 }]}>{calories}</Text>
                  <Text style={styles.summaryLab}>CALORIES</Text>
                </View>
              </View>

              {/* Incline Stats Row */}
              <View style={[styles.summaryGrid, { marginTop: -10 }]}>
                <View style={[styles.summaryBox, { padding: 15, backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}>
                  <Text style={[styles.summaryVal, { fontSize: 18, color: palette.accent.green }]}>
                    {(currentSessionPoints.length > 0 ? (currentSessionPoints.reduce((a,b)=>a+b.incline,0)/currentSessionPoints.length).toFixed(1) : "0.0")}%
                  </Text>
                  <Text style={styles.summaryLab}>AVG INCLINE</Text>
                </View>
                <View style={[styles.summaryBox, { padding: 15, backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}>
                  <Text style={[styles.summaryVal, { fontSize: 18, color: palette.accent.green }]}>
                    {(currentSessionPoints.length > 0 ? Math.max(...currentSessionPoints.map(p=>p.incline)).toFixed(1) : "0.0")}%
                  </Text>
                  <Text style={styles.summaryLab}>MAX INCLINE</Text>
                </View>
              </View>

              <View style={styles.chartSummaryCard}>
                <CombinedWorkoutChart data={samples} isLive={false} />
              </View>

              <View style={styles.summaryActions}>
                <TouchableOpacity style={[styles.summaryBtn, { backgroundColor: palette.accent.red }]} onPress={resetSession}>
                  <Text style={styles.summaryBtnText}>Discard</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.summaryBtn, { backgroundColor: palette.accent.blue }]} onPress={handleSaveGPX}>
                  <Download size={20} color="#FFF" />
                  <Text style={styles.summaryBtnText}>Save GPX</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.summaryBtn, { backgroundColor: palette.accent.green }]} onPress={handleShare}>
                  <Share2 size={20} color="#FFF" />
                  <Text style={styles.summaryBtnText}>Share</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.resetBtn} onPress={resetSession}>
                <RefreshCw size={20} color="#FFF" />
                <Text style={styles.resetBtnText}>BACK TO DASHBOARD</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1 },
  
  // Idle State
  idleContainer: { flex: 1, padding: 24, justifyContent: 'center' },
  heroSection: { marginBottom: 40 },
  heroTitle: { fontSize: 42, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  heroSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: 2 },
  scanCard: { padding: 0, overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.03)' },
  scanHeader: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  scanTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  deviceList: { maxHeight: 300, padding: 10 },
  deviceButton: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: 8 },
  deviceIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(56, 189, 248, 0.2)', justifyContent: 'center', alignItems: 'center' },
  deviceInfo: { flex: 1, marginLeft: 15 },
  deviceName: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  deviceId: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 11 },
  scanAction: { padding: 20, alignItems: 'center' },
  scanActionText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
  emptyText: { color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center', marginVertical: 30 },

  // Running State
  runningScroll: { flex: 1 },
  runningContent: { paddingHorizontal: 20, paddingBottom: 120 },
  speedFocus: { height: height * 0.35, justifyContent: 'center', alignItems: 'center' },
  metricLabel: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 4 },
  speedValueRow: { flexDirection: 'row', alignItems: 'baseline' },
  speedValue: { color: '#FFF', fontSize: 110, fontWeight: '900', letterSpacing: -5 },
  speedUnit: { color: 'rgba(255, 255, 255, 0.3)', fontSize: 24, fontWeight: '700', marginLeft: 10 },
  
  metricsDock: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 24, paddingHorizontal: 20 },
  dockItem: { alignItems: 'center', flex: 1 },
  dockValue: { color: '#FFF', fontSize: 18, fontWeight: '800', marginTop: 8 },
  dockLabel: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 9, fontWeight: '700', marginTop: 2 },
  
  chartWrapper: { marginVertical: 20, height: 180 },
  
  actionControls: { marginBottom: 30 },
  activeControlsRow: { flexDirection: 'row', gap: 15 },
  bigButton: { height: 80, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15 },
  bigButtonText: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  
  terminalBtn: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 8, opacity: 0.4, paddingBottom: 20 },
  terminalText: { color: '#F87171', fontSize: 10, fontWeight: '900' },

  // Summary State
  summaryOverlay: { flex: 1, backgroundColor: '#000' },
  summaryScroll: { padding: 30, alignItems: 'center' },
  trophyIcon: { marginTop: 20, marginBottom: 10 },
  summaryTitle: { color: '#FFF', fontSize: 32, fontWeight: '900', marginBottom: 40 },
  summaryGrid: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  summaryBox: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 25, borderRadius: 24, alignItems: 'center' },
  summaryVal: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  summaryLab: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 10, fontWeight: '700', marginTop: 5 },
  chartSummaryCard: { width: '100%', padding: 0, marginBottom: 30 },
  summaryActions: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  summaryBtn: { flex: 1, height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  summaryBtnText: { color: '#FFF', fontWeight: '800' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20 },
  resetBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 }
});

const App = () => (
  <ThemeProvider>
    <Dashboard />
  </ThemeProvider>
);

export default App;
