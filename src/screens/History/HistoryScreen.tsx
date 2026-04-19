import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { GlassCard } from '../../components/Dashboard/GlassCard';
import { ChevronRight, Calendar, Clock, MapPin } from 'lucide-react-native';

export const HistoryScreen = ({ navigation }: any) => {
  const { palette } = useTheme();
  const { history } = useWorkoutStore();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text.primary }]}>History</Text>
      </View>
      
      <FlatList
        data={[...(history || [])].reverse()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('HistoryDetail', { session: item })}>
            <GlassCard style={styles.item}>
              <View style={styles.itemHeader}>
                <View style={styles.dateRow}>
                  <Calendar size={14} color={palette.accent.blue} />
                  <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>
                <ChevronRight size={18} color={palette.text.muted} />
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <MapPin size={12} color={palette.text.secondary} />
                  <Text style={[styles.statValue, { color: '#FFF' }]}>{(item.distance/1000).toFixed(2)}km</Text>
                </View>
                <View style={styles.stat}>
                  <Clock size={12} color={palette.text.secondary} />
                  <Text style={[styles.statValue, { color: '#FFF' }]}>{Math.floor(item.duration/60)}m {item.duration%60}s</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: palette.accent.green }]}>{item.avgSpeed.toFixed(1)} km/h</Text>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={{ color: palette.text.muted }}>No workouts recorded yet.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '900' },
  item: { padding: 16, marginBottom: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontSize: 14, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }
});
