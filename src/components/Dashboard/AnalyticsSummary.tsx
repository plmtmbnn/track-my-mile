import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useWorkoutStore, WorkoutSession } from '../../store/useWorkoutStore';
import { useTheme } from '../../theme/ThemeContext';
import { Trophy, Calendar, TrendingUp } from 'lucide-react-native';
import { GlassCard } from './GlassCard';

const AnalyticsSummary = () => {
  const { palette } = useTheme();
  const { history, personalRecords } = useWorkoutStore();

  const weeklyStats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentSessions = (history || []).filter((s: WorkoutSession) => new Date(s.date) > oneWeekAgo);
    
    return {
      totalDistance: recentSessions.reduce((acc: number, s: WorkoutSession) => acc + s.distance, 0),
      totalCalories: recentSessions.reduce((acc: number, s: WorkoutSession) => acc + s.calories, 0),
      count: recentSessions.length,
    };
  }, [history]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.text.primary, fontFamily: 'VarelaRound-Regular' }]}>Analytics & Records</Text>
      
      <View style={styles.prRow}>
        <GlassCard style={styles.prCard}>
          <Trophy size={20} color={palette.accent.orange} />
          <Text style={[styles.prLabel, { color: palette.text.secondary }]}>MAX SPEED</Text>
          <Text style={[styles.prValue, { color: palette.text.primary }]}>{personalRecords.maxSpeed.toFixed(1)} <Text style={styles.unit}>km/h</Text></Text>
        </GlassCard>
        <GlassCard style={styles.prCard}>
          <TrendingUp size={20} color={palette.accent.green} />
          <Text style={[styles.prLabel, { color: palette.text.secondary }]}>LONGEST</Text>
          <Text style={[styles.prValue, { color: palette.text.primary }]}>{(personalRecords.longestDistance / 1000).toFixed(2)} <Text style={styles.unit}>km</Text></Text>
        </GlassCard>
      </View>

      <GlassCard style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Calendar size={20} color={palette.accent.blue} />
          <Text style={[styles.summaryTitle, { color: palette.text.primary }]}>Last 7 Days</Text>
        </View>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: palette.text.secondary }]}>Workouts</Text>
            <Text style={[styles.summaryValue, { color: palette.text.primary }]}>{weeklyStats.count}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: palette.text.secondary }]}>Distance</Text>
            <Text style={[styles.summaryValue, { color: palette.text.primary }]}>{(weeklyStats.totalDistance / 1000).toFixed(2)} km</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: palette.text.secondary }]}>Calories</Text>
            <Text style={[styles.summaryValue, { color: palette.text.primary }]}>{weeklyStats.totalCalories} kcal</Text>
          </View>
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20, marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  prRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  prCard: { width: '48%', padding: 16, alignItems: 'center' },
  prLabel: { fontSize: 10, fontWeight: 'bold', marginTop: 8 },
  prValue: { fontSize: 18, fontWeight: 'bold' },
  unit: { fontSize: 12, fontWeight: 'normal' },
  summaryCard: { padding: 20 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 10, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: 'bold' },
});

export default AnalyticsSummary;
