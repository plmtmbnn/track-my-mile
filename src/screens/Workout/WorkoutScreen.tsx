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
import { 
  Activity, Clock, Flame, MapPin, Zap, ChevronUp, Bluetooth, 
  Power, Trophy, Play, Pause, Square, Share2, RefreshCw, Download, Info,
  Settings, TrendingUp, Timer
} from 'lucide-react-native';
import Animated, { 
  FadeIn, 
  FadeOut,
  SlideInUp,
} from 'react-native-reanimated';

import { useBLE } from '../../hooks/useBLE';
import { useWorkoutSession, SessionState } from '../../hooks/useWorkoutSession';
import { useTheme } from '../../theme/ThemeContext';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useGoalTracking } from '../../hooks/useGoalTracking';
import { useUIStore } from '../../store/useUIStore';

import { GlassCard } from '../../components/Dashboard/GlassCard';
import { AnimatedMetric } from '../../components/Dashboard/AnimatedMetric';
import ControlButton from '../../components/Dashboard/ControlButton';
import CombinedWorkoutChart from '../../components/Charts/CombinedWorkoutChart';
import DynamicBackground from '../../theme/DynamicBackground';
import { StatusBanner } from '../../components/Dashboard/StatusBanner';

import { generateGPX } from '../../utils/GPXGenerator';
import { FileService } from '../../services/FileService';

const { width, height } = Dimensions.get('window');

export const WorkoutScreen = ({ navigation }: any) => {
  const { palette } = useTheme();
  const { currentSessionPoints } = useWorkoutStore();
  const { isFocusMode } = useUIStore();
  
  const {
    connectedDevice,
    disconnectFromDevice,
    treadmillData,
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
      <StatusBanner goalStatus={status} deltaMeters={deltaMeters} />

      <SafeAreaView style={styles.safeArea}>
        {!connectedDevice ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.idleContainer}>
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Workout</Text>
              <Text style={styles.heroSubtitle}>Connect to start tracking</Text>
            </View>
            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: palette.accent.blue }]}
              onPress={() => navigation.navigate('Connect')}
            >
              <Bluetooth size={24} color="#FFF" />
              <Text style={styles.primaryButtonText}>Connect Treadmill</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <>
          <ScrollView style={styles.runningScroll} contentContainerStyle={styles.runningContent} showsVerticalScrollIndicator={false}>
            <View style={styles.speedFocus}>
              <Text style={styles.metricLabel}>{getEffortLabel()}</Text>
              <View style={styles.speedValueRow}>
                <Text style={styles.speedValue}>{speedValue.toFixed(1)}</Text>
                <Text style={styles.speedUnit}>km/h</Text>
              </View>
            </View>

            <View style={styles.metricsDock}>
              <View style={styles.dockItem}><Timer size={18} color={palette.accent.blue} /><Text style={styles.dockValue}>{formatTime(totalSeconds)}</Text><Text style={styles.dockLabel}>TIME</Text></View>
              <View style={styles.dockItem}><TrendingUp size={18} color={palette.accent.green} /><Text style={styles.dockValue}>{currentPace}</Text><Text style={styles.dockLabel}>PACE</Text></View>
              <View style={styles.dockItem}><MapPin size={18} color={palette.accent.purple} /><Text style={styles.dockValue}>{totalDistanceKm.toFixed(2)}</Text><Text style={styles.dockLabel}>KM</Text></View>
            </View>

            <View style={[styles.metricsDock, { marginTop: 15, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
              <View style={styles.dockItem}><Text style={[styles.dockValue, { fontSize: 14 }]}>{avgPace}</Text><Text style={styles.dockLabel}>AVG PACE</Text></View>
              <View style={styles.dockItem}><Text style={[styles.dockValue, { fontSize: 14 }]}>{maxSpeed.toFixed(1)}</Text><Text style={styles.dockLabel}>MAX SPD</Text></View>
              <View style={styles.dockItem}><Flame size={14} color={palette.accent.red} /><Text style={[styles.dockValue, { fontSize: 14 }]}>{calories}</Text><Text style={styles.dockLabel}>KCAL</Text></View>
              <View style={styles.dockItem}><ChevronUp size={14} color={palette.accent.orange} /><Text style={[styles.dockValue, { fontSize: 14 }]}>{(treadmillData?.incline || 0).toFixed(1)}</Text><Text style={styles.dockLabel}>INC %</Text></View>
            </View>

            <View style={styles.chartWrapper}>
              <CombinedWorkoutChart data={samples} isLive={state !== SessionState.FINISHED} />
            </View>

            {!isRunning && (
              <TouchableOpacity onPress={handleTerminate} style={styles.terminalBtn}>
                <Power size={14} color={palette.accent.red} />
                <Text style={styles.terminalText}>TERMINATE CONNECTION</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={[styles.actionControls, { paddingHorizontal: 20, backgroundColor: 'transparent' }]}>
            {state === SessionState.IDLE ? (
              <TouchableOpacity style={[styles.bigButton, { backgroundColor: palette.accent.green }]} onPress={startSession}>
                <Play size={40} color="#000" fill="#000" /><Text style={styles.bigButtonText}>START</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.activeControlsRow}>
                <TouchableOpacity style={[styles.bigButton, { backgroundColor: palette.accent.orange, flex: 2 }]} onPress={state === SessionState.RUNNING ? pauseSession : resumeSession}>
                  {state === SessionState.RUNNING ? <Pause size={32} color="#000" fill="#000" /> : <Play size={32} color="#000" fill="#000" />}
                  <Text style={styles.bigButtonText}>{state === SessionState.RUNNING ? 'PAUSE' : 'RESUME'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.bigButton, { backgroundColor: palette.accent.red, flex: 1 }]} onPress={stopSession}>
                  <Square size={24} color="#FFF" fill="#FFF" /><Text style={[styles.bigButtonText, { color: '#FFF' }]}>STOP</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          </>
        )}
      </SafeAreaView>

      <Modal visible={state === SessionState.FINISHED} transparent animationType="slide">
        <View style={styles.summaryOverlay}>
          <DynamicBackground speed={0} />
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.summaryScroll}>
              <Trophy size={64} color={palette.accent.orange} style={styles.trophyIcon} />
              <Text style={styles.summaryTitle}>Run Complete</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryBox}><Text style={styles.summaryVal}>{totalDistanceKm.toFixed(2)}</Text><Text style={styles.summaryLab}>TOTAL KM</Text></View>
                <View style={styles.summaryBox}><Text style={styles.summaryVal}>{formatTime(totalSeconds)}</Text><Text style={styles.summaryLab}>DURATION</Text></View>
              </View>
              <View style={styles.summaryGrid}>
                <View style={[styles.summaryBox, { padding: 15 }]}><Text style={[styles.summaryVal, { fontSize: 20 }]}>{avgPace}</Text><Text style={styles.summaryLab}>AVG PACE</Text></View>
                <View style={[styles.summaryBox, { padding: 15 }]}><Text style={[styles.summaryVal, { fontSize: 20 }]}>{maxSpeed.toFixed(1)}</Text><Text style={styles.summaryLab}>MAX SPEED</Text></View>
                <View style={[styles.summaryBox, { padding: 15 }]}><Text style={[styles.summaryVal, { fontSize: 20 }]}>{calories}</Text><Text style={styles.summaryLab}>CALORIES</Text></View>
              </View>
              <View style={[styles.summaryGrid, { marginTop: -10 }]}>
                <View style={[styles.summaryBox, { padding: 15, backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}><Text style={[styles.summaryVal, { fontSize: 18, color: palette.accent.green }]}>{(currentSessionPoints.length > 0 ? (currentSessionPoints.reduce((a,b)=>a+b.incline,0)/currentSessionPoints.length).toFixed(1) : "0.0")}%</Text><Text style={styles.summaryLab}>AVG INCLINE</Text></View>
                <View style={[styles.summaryBox, { padding: 15, backgroundColor: 'rgba(74, 222, 128, 0.1)' }]}><Text style={[styles.summaryVal, { fontSize: 18, color: palette.accent.green }]}>{(currentSessionPoints.length > 0 ? Math.max(...currentSessionPoints.map(p=>p.incline)).toFixed(1) : "0.0")}%</Text><Text style={styles.summaryLab}>MAX INCLINE</Text></View>
              </View>
              <View style={styles.chartSummaryCard}><CombinedWorkoutChart data={samples} isLive={false} /></View>
              <View style={styles.summaryActions}>
                <TouchableOpacity style={[styles.summaryBtn, { backgroundColor: palette.accent.red }]} onPress={resetSession}><Text style={styles.summaryBtnText}>Discard</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.summaryBtn, { backgroundColor: palette.accent.blue }]} onPress={handleSaveGPX}><Download size={20} color="#FFF" /><Text style={styles.summaryBtnText}>Save GPX</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.summaryBtn, { backgroundColor: palette.accent.green }]} onPress={handleShare}><Share2 size={20} color="#FFF" /><Text style={styles.summaryBtnText}>Share</Text></TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.resetBtn} onPress={resetSession}><RefreshCw size={20} color="#FFF" /><Text style={styles.resetBtnText}>BACK TO DASHBOARD</Text></TouchableOpacity>
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
  idleContainer: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  heroSection: { marginBottom: 40, alignItems: 'center' },
  heroTitle: { fontSize: 42, fontWeight: '900', color: '#FFF' },
  heroSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' },
  primaryButton: { height: 60, width: '100%', borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
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
