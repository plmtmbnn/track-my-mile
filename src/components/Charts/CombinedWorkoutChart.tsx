import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../theme/ThemeContext';
import { Activity, ChevronUp } from 'lucide-react-native';
import GlassCard from '../Dashboard/GlassCard';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface DataPoint {
  time: number;
  speed: number;
  incline: number;
  pace: number;
  distance: number;
}

interface CombinedWorkoutChartProps {
  data: DataPoint[];
  isLive?: boolean;
}

const CombinedWorkoutChart = ({ data, isLive = true }: CombinedWorkoutChartProps) => {
  const { theme, palette } = useTheme() as any; // Using custom palette
  const [visibleMetrics, setVisibleMetrics] = useState({
    pace: true,
    incline: true,
  });

  const toggleMetric = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const processedData = useMemo(() => {
    const windowSize = isLive ? 100 : 2000;
    const slice = data.slice(-windowSize);
    
    if (slice.length === 0) return { pace: [], incline: [] };
    
    return {
      pace: slice.map(d => ({ 
        value: d.pace > 0 ? d.pace : 0, 
        label: (d.distance / 1000).toFixed(2)
      })),
      incline: slice.map(d => ({ 
        value: d.incline, 
        label: (d.distance / 1000).toFixed(2) 
      })),
    };
  }, [data, isLive]);

  if (data.length < 2) return null;

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text.primary, fontFamily: 'VarelaRound-Regular' }]}>Performance Map</Text>
        <View style={styles.legend}>
          <MetricToggle 
            label="Pace" 
            active={visibleMetrics.pace} 
            color={palette.accent.blue} 
            onPress={() => toggleMetric('pace')} 
          />
          <MetricToggle 
            label="Incline" 
            active={visibleMetrics.incline} 
            color={palette.accent.green} 
            onPress={() => toggleMetric('incline')} 
          />
        </View>
      </View>

      <View style={styles.chartBox}>
        <LineChart
          areaChart
          curved
          data={visibleMetrics.pace ? processedData.pace : [{ value: 0 }]}
          data2={visibleMetrics.incline ? processedData.incline : [{ value: 0 }]}
          height={180}
          width={SCREEN_WIDTH - 80}
          spacing={isLive ? 20 : (SCREEN_WIDTH - 90) / Math.max(processedData.pace.length, 1)}
          initialSpacing={10}
          color1={palette.accent.blue}
          color2={palette.accent.green}
          thickness={3}
          startFillColor1={palette.accent.blue}
          startFillColor2={palette.accent.green}
          endFillColor1="transparent"
          endFillColor2="transparent"
          startOpacity={0.3}
          endOpacity={0.01}
          noOfSections={4}
          yAxisColor="transparent"
          xAxisColor="transparent"
          yAxisTextStyle={{ color: palette.text.muted, fontSize: 10, fontFamily: 'VarelaRound-Regular' }}
          rulesColor={palette.glass.border}
          hideDataPoints
          xAxisLabelTextStyle={{ color: palette.text.muted, fontSize: 9, fontFamily: 'VarelaRound-Regular' }}
          pointerConfig={{
            pointerStripUptoDataPoint: true,
            pointerStripColor: palette.text.muted,
            pointerStripWidth: 2,
            strokeDashArray: [5, 5],
            radius: 4,
            pointerLabelComponent: (items: any) => {
              return (
                <View style={[styles.tooltip, { backgroundColor: palette.intensity.low[0], borderColor: palette.glass.border }]}>
                  <Text style={[styles.tooltipTitle, { color: palette.text.secondary }]}>{(items[0]?.label || 0)} km</Text>
                  <View style={styles.tooltipRow}>
                    <Activity size={12} color={palette.accent.blue} />
                    <Text style={[styles.tooltipText, { color: palette.text.primary }]}> {items[0]?.value.toFixed(2)} min/km</Text>
                  </View>
                  {items[1] && (
                    <View style={styles.tooltipRow}>
                      <ChevronUp size={12} color={palette.accent.green} />
                      <Text style={[styles.tooltipText, { color: palette.text.primary }]}> {items[1]?.value.toFixed(1)} %</Text>
                    </View>
                  )}
                </View>
              );
            },
          }}
        />
      </View>
    </GlassCard>
  );
};

const MetricToggle = ({ label, active, color, onPress }: any) => {
  const { palette } = useTheme();
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.toggle, { borderColor: active ? color : palette.glass.border, backgroundColor: active ? `${color}20` : 'transparent' }]}
    >
      <View style={[styles.dot, { backgroundColor: color, opacity: active ? 1 : 0.3 }]} />
      <Text style={[styles.toggleLabel, { color: active ? palette.text.primary : palette.text.muted, fontFamily: 'VarelaRound-Regular' }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 'bold' },
  legend: { flexDirection: 'row', gap: 8 },
  toggle: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1 },
  toggleLabel: { fontSize: 10, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  chartBox: { marginLeft: -10 },
  tooltip: { padding: 8, borderRadius: 12, borderWidth: 1, minWidth: 110, position: 'absolute', bottom: 40, left: -55, elevation: 5 },
  tooltipTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  tooltipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  tooltipText: { fontSize: 11, fontWeight: 'bold' },
});

export default CombinedWorkoutChart;
