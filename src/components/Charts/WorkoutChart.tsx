import React, { useMemo } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../theme/ThemeContext';
import GlassCard from '../Dashboard/GlassCard';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ChartDataPoint {
  time: number;
  value: number;
}

interface InteractiveChartProps {
  data: ChartDataPoint[];
  label: string;
  unit: string;
  color?: string;
  isLive?: boolean;
}

const InteractiveChart = ({ 
  data, 
  label, 
  unit, 
  color, 
  isLive = true 
}: InteractiveChartProps) => {
  const { palette } = useTheme();
  const chartColor = color || palette.accent.blue;

  // Optimized data window for live view
  const processedData = useMemo(() => {
    const windowSize = isLive ? 60 : 1000;
    const slice = data.slice(-windowSize);
    
    if (slice.length === 0) return [{ value: 0, label: '0' }];
    
    return slice.map((d) => ({
      value: d.value,
      label: d.time.toString(),
      dataPointText: d.value.toFixed(1),
    }));
  }, [data, isLive]);

  if (processedData.length < 2) {
    return (
      <GlassCard style={styles.placeholder}>
        <Text style={{ color: palette.text.muted }}>Waiting for workout data...</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text.primary, fontFamily: 'VarelaRound-Regular' }]}>{label}</Text>
        <Text style={[styles.unit, { color: palette.text.secondary }]}>{unit}</Text>
      </View>

      <LineChart
        areaChart
        curved
        data={processedData}
        height={180}
        width={SCREEN_WIDTH - 72}
        spacing={isLive ? 25 : (SCREEN_WIDTH - 80) / processedData.length}
        initialSpacing={10}
        color={chartColor}
        thickness={3}
        startFillColor={chartColor}
        endFillColor="transparent"
        startOpacity={0.3}
        endOpacity={0.01}
        noOfSections={4}
        yAxisColor="transparent"
        xAxisColor="transparent"
        yAxisTextStyle={{ color: palette.text.muted, fontSize: 10 }}
        rulesColor={palette.glass.border}
        rulesType="solid"
        hideDataPoints={isLive}
        dataPointsColor={chartColor}
        pointerConfig={{
          pointerStripUptoDataPoint: true,
          pointerStripColor: palette.text.muted,
          pointerStripWidth: 2,
          strokeDashArray: [5, 5],
          pointerColor: chartColor,
          radius: 4,
          pointerLabelComponent: (items: any) => {
            return (
              <View style={[styles.tooltip, { backgroundColor: palette.intensity.low[0], borderColor: palette.glass.border }]}>
                <Text style={[styles.tooltipValue, { color: palette.text.primary }]}>
                  {items[0].value.toFixed(1)} {unit}
                </Text>
                <Text style={[styles.tooltipTime, { color: palette.text.muted }]}>
                  {items[0].label}s
                </Text>
              </View>
            );
          },
        }}
        isAnimated={!isLive}
        animateOnDataChange={false}
      />
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20, paddingHorizontal: 4 },
  title: { fontSize: 18, fontWeight: 'bold' },
  unit: { fontSize: 12, fontWeight: '600' },
  placeholder: { height: 220, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  tooltip: { padding: 8, borderRadius: 8, borderWidth: 1, minWidth: 80, alignItems: 'center', position: 'absolute', bottom: 20, left: -40, elevation: 10 },
  tooltipValue: { fontSize: 14, fontWeight: 'bold' },
  tooltipTime: { fontSize: 10 }
});

export default InteractiveChart;
