import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { GlassCard } from '../../components/Dashboard/GlassCard';
import { Activity, Bluetooth, Trophy, Play, ChevronRight } from 'lucide-react-native';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useBLE } from '../../hooks/useBLE';

export const HomeScreen = ({ navigation }: any) => {
  const { palette } = useTheme();
  const { history } = useWorkoutStore();
  const { connectedDevice } = useBLE();

  const weeklyStats = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentOnes = (history || []).filter(s => new Date(s.date) >= oneWeekAgo);
    const totalDist = recentOnes.reduce((acc, s) => acc + s.distance, 0);
    
    return {
      distance: (totalDist / 1000).toFixed(1),
      count: recentOnes.length
    };
  }, [history]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: palette.background }]} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text.primary }]}>Dashboard</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Connect')}
          style={[styles.connectionPill, { backgroundColor: connectedDevice ? palette.accent.green + '20' : palette.accent.red + '20' }]}
        >
          <Bluetooth size={14} color={connectedDevice ? palette.accent.green : palette.accent.red} />
          <Text style={{ color: connectedDevice ? palette.accent.green : palette.accent.red, marginLeft: 6, fontSize: 12 }}>
            {connectedDevice ? 'Connected' : 'Disconnected'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Weekly Stats Section */}
      <View style={styles.statsRow}>
        <GlassCard style={styles.statCard}>
          <Activity size={20} color={palette.accent.blue} />
          <Text style={styles.statValue}>{weeklyStats.distance}</Text>
          <Text style={styles.statLabel}>KM THIS WEEK</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Trophy size={20} color={palette.accent.orange} />
          <Text style={styles.statValue}>{weeklyStats.count}</Text>
          <Text style={styles.statLabel}>RUNS</Text>
        </GlassCard>
      </View>

      {/* Quick Actions */}
      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: palette.accent.blue }]}
        onPress={() => {
          if (!connectedDevice) {
            Alert.alert('Device Required', 'Please connect to a treadmill first.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Go to Connect', onPress: () => navigation.navigate('Connect') }
            ]);
          } else {
            navigation.navigate('Workout');
          }
        }}
      >
        <Play size={24} color="#FFF" fill="#FFF" />
        <Text style={styles.actionButtonText}>Start New Workout</Text>
      </TouchableOpacity>

      {/* Recent History */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: palette.text.primary }]}>Recent History</Text>
        <TouchableOpacity onPress={() => navigation.navigate('History')}>
          <Text style={{ color: palette.accent.blue }}>See All</Text>
        </TouchableOpacity>
      </View>

      {(history || []).slice(-3).reverse().map((session) => (
        <TouchableOpacity key={session.id} onPress={() => navigation.navigate('HistoryDetail', { session })}>
          <GlassCard style={styles.historyItem}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{new Date(session.date).toLocaleDateString()}</Text>
              <Text style={{ color: palette.text.secondary, fontSize: 12 }}>{(session.distance/1000).toFixed(2)}km in {Math.floor(session.duration/60)}m</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
               <Text style={{ color: palette.accent.green, fontWeight: 'bold' }}>{session.avgSpeed.toFixed(1)} km/h</Text>
               <ChevronRight size={16} color={palette.text.muted} />
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '900' },
  connectionPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statCard: { flex: 1, alignItems: 'center', padding: 20 },
  statValue: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 8 },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold', marginTop: 4 },
  actionButton: { height: 70, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 40 },
  actionButtonText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold' },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, marginBottom: 10 }
});
