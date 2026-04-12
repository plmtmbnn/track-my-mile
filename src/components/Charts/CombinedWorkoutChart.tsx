import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../theme/ThemeContext';
import { Activity, ChevronUp } from 'lucide-react-native';
import { GlassCard } from '../Dashboard/GlassCard';
import { getSmoothScale } from '../../utils/ChartScaler';
import { generateXAxisLabels } from '../../utils/ChartLabelGenerator';

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
  const { palette } = useTheme();
  
  // Custom colors for Phase 7
  const COLORS = {
    speed: '#3B82F6',
    incline: '#F97316',
  };

  const [visibleMetrics, setVisibleMetrics] = useState({
    speed: true,
    incline: true,
  });

  const toggleMetric = (metric: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const { processedData, chartSpacing, labels } = useMemo(() => {
    if (data.length === 0) return { 
      processedData: { speed: [], incline: [] }, 
      chartSpacing: 0,
      labels: [] 
    };

    const lastPoint = data[data.length - 1];
    const totalDistKm = lastPoint.distance / 1000;
    
    // 1. Get smooth scale (Range and Step)
    const scale = getSmoothScale(totalDistKm);
    
    // 2. Generate clean labels
    const generatedLabels = generateXAxisLabels(scale.maxRange, scale.stepSize, 6);

    // 3. Calculate dynamic spacing for "Auto-Zoom"
    // We want the total data points to occupy (totalDistKm / maxRange) of the chart width
    const chartAreaWidth = SCREEN_WIDTH - 100;
    const targetWidth = (totalDistKm / scale.maxRange) * chartAreaWidth;
    const spacing = data.length > 1 ? targetWidth / data.length : 20;

    let lastLabelIndex = -1;

    const mappedSpeed = data.map((d) => {
      const currentDistKm = d.distance / 1000;
      
      // Label placement logic: find if this point crosses a tick
      let label = '';
      const matchingLabelIdx = generatedLabels.findIndex((l, lIdx) => 
        lIdx > lastLabelIndex && currentDistKm >= l.value
      );

      if (matchingLabelIdx !== -1) {
        label = generatedLabels[matchingLabelIdx].label;
        lastLabelIndex = matchingLabelIdx;
      }

      return {
        value: d.speed,
        label: label,
        labelTextStyle: { color: '#FFF', fontSize: 9 },
      };
    });

    const mappedIncline = data.map(d => {
      // Validation logging
      if (data.indexOf(d) === data.length - 1) {
        console.log(`[Chart Incline Check] Real-time: ${lastPoint.incline}, Mapped: ${d.incline}`);
      }
      return {
        value: d.incline,
      };
    });

    return {
      processedData: { speed: mappedSpeed, incline: mappedIncline },
      chartSpacing: spacing,
      labels: generatedLabels
    };
  }, [data]);

  if (data.length < 2) return null;

  const finalSpacing = isLive ? chartSpacing : Math.max(2, (SCREEN_WIDTH - 120) / Math.max(processedData.speed.length, 1));

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: palette.text.primary }]}>Performance Map</Text>
          <Text style={[styles.subtitle, { color: palette.text.secondary, fontSize: 10 }]}>Blue: Speed | Orange: Incline</Text>
        </View>
        <View style={styles.legend}>
          <MetricToggle 
            label="Speed" 
            active={visibleMetrics.speed} 
            color={COLORS.speed} 
            onPress={() => toggleMetric('speed')} 
          />
          <MetricToggle 
            label="Incline" 
            active={visibleMetrics.incline} 
            color={COLORS.incline} 
            onPress={() => toggleMetric('incline')} 
          />
        </View>
      </View>

      <View style={styles.chartBox}>
        <LineChart
          areaChart
          curved
          data={visibleMetrics.speed ? processedData.speed : [{ value: 0 }]}
          secondaryData={visibleMetrics.incline ? processedData.incline : [{ value: 0 }]}
          height={180}
          width={SCREEN_WIDTH - 100}
          spacing={finalSpacing}
          initialSpacing={10}
          color1={COLORS.speed}
          color2={COLORS.incline}
          thickness={3}
          startFillColor1={COLORS.speed}
          startFillColor2={COLORS.incline}
          endFillColor1="transparent"
          endFillColor2="transparent"
          startOpacity={0.3}
          endOpacity={0.01}
          noOfSections={4}
          yAxisColor="#FFF"
          xAxisColor="#FFF"
          yAxisTextStyle={{ color: COLORS.speed, fontSize: 10 }}
          yAxisLabelSuffix=" "
          secondaryYAxis={{
            noOfSections: 4,
            yAxisTextStyle: { color: COLORS.incline, fontSize: 10 },
            yAxisLabelSuffix: "%",
            yAxisColor: "#FFF",
            maxValue: 15,
          }}
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
                  <Text style={[styles.tooltipTitle, { color: '#cbd5e1' }]}>Distance Trace</Text>
                  <View style={styles.tooltipRow}>
                    <Activity size={12} color={COLORS.speed} />
                    <Text style={[styles.tooltipText, { color: '#FFF' }]}> {items[0]?.value.toFixed(1)} km/h</Text>
                  </View>
                  {items[1] && (
                    <View style={styles.tooltipRow}>
                      <ChevronUp size={12} color={COLORS.incline} />
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
