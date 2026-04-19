import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import CombinedWorkoutChart from '../../components/Charts/CombinedWorkoutChart';
import { ChevronLeft, MapPin, Clock, Flame, Zap, TrendingUp } from 'lucide-react-native';
import { GlassCard } from '../../components/Dashboard/GlassCard';

export const HistoryDetailScreen = ({ route, navigation }: any) => {
  const { palette } = useTheme();
  const { session } = route.params;

  const pace = session.distance > 0 ? (session.duration / 60) / (session.distance / 1000) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={[styles.title, { color: palette.text.primary }]}>Workout Detail</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={styles.dateText}>{new Date(session.date).toLocaleString()}</Text>

        <View style={styles.chartContainer}>
          <CombinedWorkoutChart data={session.samples} isLive={false} />
        </View>

        <View style={styles.grid}>
          <GlassCard style={styles.statBox}>
            <MapPin size={16} color={palette.accent.blue} />
            <Text style={styles.statLabel}>DISTANCE</Text>
            <Text style={styles.statValue}>{(session.distance/1000).toFixed(2)} km</Text>
          </GlassCard>

          <GlassCard style={styles.statBox}>
            <Clock size={16} color={palette.accent.green} />
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.statValue}>{Math.floor(session.duration/60)}m {session.duration%60}s</Text>
          </GlassCard>

          <GlassCard style={styles.statBox}>
            <TrendingUp size={16} color={palette.accent.purple} />
            <Text style={styles.statLabel}>AVG PACE</Text>
            <Text style={styles.statValue}>{pace.toFixed(2)} /km</Text>
          </GlassCard>

          <GlassCard style={styles.statBox}>
            <Zap size={16} color={palette.accent.orange} />
            <Text style={styles.statLabel}>MAX SPEED</Text>
            <Text style={styles.statValue}>{session.maxSpeed.toFixed(1)} km/h</Text>
          </GlassCard>

          <GlassCard style={styles.statBox}>
            <Flame size={16} color={palette.accent.red} />
            <Text style={styles.statLabel}>CALORIES</Text>
            <Text style={styles.statValue}>{session.calories} kcal</Text>
          </GlassCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  dateText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 20 },
  chartContainer: { marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { width: '48%', padding: 15, alignItems: 'center', gap: 6 },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' },
  statValue: { color: '#FFF', fontSize: 16, fontWeight: '900' }
});
