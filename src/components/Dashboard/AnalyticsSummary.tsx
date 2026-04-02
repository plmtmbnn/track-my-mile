import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useWorkoutStore, WorkoutSession } from '../../store/useWorkoutStore';
import { useTheme } from '../../theme/ThemeContext';
import { Trophy, Calendar, TrendingUp } from 'lucide-react-native';

const AnalyticsSummary = () => {
  const { theme } = useTheme();
  const { history, personalRecords } = useWorkoutStore();

  const weeklyStats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentSessions = history.filter((s: WorkoutSession) => new Date(s.date) > oneWeekAgo);
    
    return {
      totalDistance: recentSessions.reduce((acc: number, s: WorkoutSession) => acc + s.distance, 0),
      totalCalories: recentSessions.reduce((acc: number, s: WorkoutSession) => acc + s.calories, 0),
      count: recentSessions.length,
    };
  }, [history]);

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>Analytics & Records</Text>
      
      {/* PR Cards */}
      <View style={styles.prRow}>
        <View style={[styles.prCard, { backgroundColor: theme.card }]}>
          <Trophy size={20} color={theme.warning} />
          <Text style={[styles.prLabel, { color: theme.subtext }]}>MAX SPEED</Text>
          <Text style={[styles.prValue, { color: theme.text }]}>{personalRecords.maxSpeed.toFixed(1)} <Text style={styles.unit}>km/h</Text></Text>
        </View>
        <View style={[styles.prCard, { backgroundColor: theme.card }]}>
          <TrendingUp size={20} color={theme.success} />
          <Text style={[styles.prLabel, { color: theme.subtext }]}>LONGEST</Text>
          <Text style={[styles.prValue, { color: theme.text }]}>{personalRecords.longestDistance} <Text style={styles.unit}>m</Text></Text>
        </View>
      </View>

      {/* Weekly Summary */}
      <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
        <View style={styles.summaryHeader}>
          <Calendar size={20} color="#FFF" />
          <Text style={styles.summaryTitle}>Last 7 Days</Text>
        </View>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Workouts</Text>
            <Text style={styles.summaryValue}>{weeklyStats.count}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Distance</Text>
            <Text style={styles.summaryValue}>{(weeklyStats.totalDistance / 1000).toFixed(2)} km</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Calories</Text>
            <Text style={styles.summaryValue}>{weeklyStats.totalCalories} kcal</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  prRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  prCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    alignItems: 'center',
  },
  prLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 8,
  },
  prValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 12,
    fontWeight: 'normal',
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AnalyticsSummary;
