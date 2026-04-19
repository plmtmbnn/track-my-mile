import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { GlassCard } from '../../components/Dashboard/GlassCard';
import { Trophy, Clock, Zap, ChevronRight } from 'lucide-react-native';

const TRAINING_PLANS = [
  {
    id: 'plan_1',
    title: 'Beginner 5K',
    description: 'A 12-week plan to get you running your first 5K.',
    workouts: 36,
    difficulty: 'Easy',
    color: '#3B82F6'
  },
  {
    id: 'plan_2',
    title: 'Interval Shred',
    description: 'High intensity intervals to boost your metabolism.',
    workouts: 24,
    difficulty: 'Hard',
    color: '#F97316'
  },
  {
    id: 'plan_3',
    title: 'Incline Power',
    description: 'Build leg strength with structured hill climbs.',
    workouts: 18,
    difficulty: 'Medium',
    color: '#10B981'
  }
];

export const TrainingScreen = () => {
  const { palette } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text.primary }]}>Training</Text>
      </View>

      <FlatList
        data={TRAINING_PLANS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => {}}>
            <GlassCard style={styles.planCard}>
              <View style={[styles.accentBar, { backgroundColor: item.color }]} />
              <View style={styles.planContent}>
                <View style={styles.planHeader}>
                  <Text style={styles.planTitle}>{item.title}</Text>
                  <ChevronRight size={20} color={palette.text.muted} />
                </View>
                <Text style={styles.planDesc}>{item.description}</Text>
                
                <View style={styles.planMeta}>
                  <View style={styles.metaItem}>
                    <Clock size={12} color={palette.text.secondary} />
                    <Text style={styles.metaText}>{item.workouts} Workouts</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Zap size={12} color={palette.text.secondary} />
                    <Text style={styles.metaText}>{item.difficulty}</Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '900' },
  planCard: { flexDirection: 'row', padding: 0, marginBottom: 20, overflow: 'hidden' },
  accentBar: { width: 6 },
  planContent: { flex: 1, padding: 20 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  planDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 15, lineHeight: 20 },
  planMeta: { flexDirection: 'row', gap: 15 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700' }
});
