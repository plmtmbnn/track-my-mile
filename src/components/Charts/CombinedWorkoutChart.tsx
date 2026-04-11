import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../theme/ThemeContext';
import { Activity, ChevronUp } from 'lucide-react-native';
import { GlassCard } from '../Dashboard/GlassCard';

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
    if (data.length === 0) return { pace: [], incline: [] };

    const totalDistKm = data[data.length - 1].distance / 1000;
    
    // Determine Step Size based on requirements
    let stepSize = 0.01; // 10m
    if (totalDistKm >= 10) stepSize = 1.0;
    else if (totalDistKm >= 5) stepSize = 0.5;
    else if (totalDistKm >= 1) stepSize = 0.1;

    let lastLabelDist = -stepSize;

    return {
      pace: data.map(d => {
        const currentDistKm = d.distance / 1000;
        const showLabel = currentDistKm >= lastLabelDist + stepSize;
        if (showLabel) lastLabelDist = currentDistKm;

        return {
          value: d.pace > 0 ? d.pace : 0,
          label: showLabel ? currentDistKm.toFixed(2) : '',
          labelTextStyle: { color: '#FFF', fontSize: 10 },
        };
      }),
      incline: data.map(d => ({
        value: d.incline,
      })),
    };
  }, [data]);

  if (data.length < 2) return null;

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text.primary }]}>Performance Map</Text>
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
          spacing={isLive ? Math.max(2, (SCREEN_WIDTH - 100) / processedData.pace.length) : (SCREEN_WIDTH - 100) / processedData.pace.length}
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
          yAxisColor="#FFF"
          xAxisColor="#FFF"
          yAxisTextStyle={{ color: '#FFF', fontSize: 10 }}
          yAxisLabelSuffix=" "
          rulesColor="rgba(255,255,255,0.1)"
          hideDataPoints
          xAxisLabelTextStyle={{ color: '#FFF', fontSize: 9 }}
          pointerConfig={{
            pointerStripUptoDataPoint: true,
            pointerStripColor: 'rgba(255,255,255,0.5)',
            pointerStripWidth: 2,
            strokeDashArray: [5, 5],
            radius: 4,
            pointerLabelComponent: (items: any) => {
              return (
                <View style={[styles.tooltip, { backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={[styles.tooltipTitle, { color: '#cbd5e1' }]}>{items[0]?.label || '---'} km</Text>
                  <View style={styles.tooltipRow}>
                    <Activity size={12} color={palette.accent.blue} />
                    <Text style={[styles.tooltipText, { color: '#FFF' }]}> {items[0]?.value.toFixed(2)} min/km</Text>
                  </View>
                  {items[1] && (
                    <View style={styles.tooltipRow}>
                      <ChevronUp size={12} color={palette.accent.green} />
                      <Text style={[styles.tooltipText, { color: '#FFF' }]}> {items[1]?.value.toFixed(1)} %</Text>
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
