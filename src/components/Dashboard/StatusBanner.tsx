import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useUIStore, AudioMode } from '../../store/useUIStore';
import { GoalStatus } from '../../hooks/useGoalTracking';
import { MotiView } from 'moti';

interface StatusBannerProps {
  goalStatus: GoalStatus;
  deltaMeters: number;
}

export const StatusBanner = ({ goalStatus, deltaMeters }: StatusBannerProps) => {
  const { audioMode, setAudioMode, isFocusMode, toggleFocusMode } = useUIStore();

  const getGoalColor = () => {
    switch (goalStatus) {
      case 'AHEAD': return '#00FF87';
      case 'BEHIND': return '#FF5F6D';
      default: return '#FFFFFF';
    }
  };

  const getAudioIcon = () => {
    switch (audioMode) {
      case AudioMode.MUTE: return '🔇';
      case AudioMode.IMPORTANT: return '🔔';
      case AudioMode.FULL: return '🗣️';
    }
  };

  return (
    <View style={styles.container}>
      <MotiView 
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.goalPill}
      >
        <View style={[styles.statusDot, { backgroundColor: getGoalColor() }]} />
        <Text style={styles.goalText}>
          {goalStatus === 'ON_TRACK' ? 'On Pace' : `${Math.abs(deltaMeters)}m ${goalStatus === 'AHEAD' ? 'Ahead' : 'Behind'}`}
        </Text>
      </MotiView>

      <View style={styles.rightActions}>
        <TouchableOpacity 
          onPress={() => {
            const modes = [AudioMode.MUTE, AudioMode.IMPORTANT, AudioMode.FULL];
            const nextIndex = (modes.indexOf(audioMode) + 1) % modes.length;
            setAudioMode(modes[nextIndex]);
          }}
          style={styles.iconButton}
        >
          <Text style={styles.icon}>{getAudioIcon()}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={toggleFocusMode}
          style={[styles.iconButton, isFocusMode && styles.activeIcon]}
        >
          <Text style={styles.icon}>🎯</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  goalText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIcon: {
    backgroundColor: '#00D2FF',
  },
  icon: {
    fontSize: 20,
  },
});
