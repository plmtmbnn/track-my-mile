import React, { useEffect, useState, useRef, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { useTheme } from '../../theme/ThemeContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { LineChart } from 'react-native-gifted-charts';

interface MetricCardProps {
  label: string;
  value: number | string | undefined;
  unit: string;
  icon?: React.ReactNode;
  highlightTrigger?: any;
  history?: number[];
}

const MetricCard = ({ label, value, unit, icon, highlightTrigger, history = [] }: MetricCardProps) => {
  const { palette } = useTheme();
  const [highlightColor, setHighlightColor] = useState<string | null>(null);
  const lastValueRef = useRef<number | null>(null);

  useEffect(() => {
    if (highlightTrigger !== undefined && typeof highlightTrigger === 'number') {
      setHighlightColor(palette.accent.blue);
      const timer = setTimeout(() => setHighlightColor(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [highlightTrigger, palette.accent.blue]);

  const trend = useMemo(() => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof numValue !== 'number' || isNaN(numValue) || lastValueRef.current === null) {
      if (typeof numValue === 'number' && !isNaN(numValue)) lastValueRef.current = numValue;
      return 'neutral';
    }
    const diff = numValue - lastValueRef.current;
    lastValueRef.current = numValue;
    if (diff > 0.01) return 'up';
    if (diff < -0.01) return 'down';
    return 'neutral';
  }, [value]);

  const sparklineData = useMemo(() => {
    return history.slice(-10).map(v => ({ value: v }));
  }, [history]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0, backgroundColor: highlightColor || palette.glass.background }}
      transition={{ type: 'timing', duration: 500 }}
      style={[styles.container, { borderColor: palette.glass.border }]}
    >
      <View style={styles.topRow}>
        <View style={styles.header}>
          {icon}
          <Text style={[styles.label, { color: palette.text.secondary }]}>{label}</Text>
        </View>
        <View style={styles.trendContainer}>
          {trend === 'up' && <TrendingUp size={12} color={palette.accent.green} />}
          {trend === 'down' && <TrendingDown size={12} color={palette.accent.red} />}
          {trend === 'neutral' && <Minus size={12} color={palette.text.muted} />}
        </View>
      </View>

      <View style={styles.valueRow}>
        <MotiText style={[styles.value, { color: highlightColor ? '#FFF' : palette.text.primary }]}>
          {typeof value === 'number' ? value.toFixed(1) : (value || '--')}
        </MotiText>
        <Text style={[styles.unit, { color: palette.text.muted }]}> {unit}</Text>
      </View>

      {sparklineData.length > 1 && (
        <View style={styles.sparklineWrapper}>
          <LineChart
            data={sparklineData}
            hideDataPoints
            thickness={2}
            color={highlightColor ? '#FFF' : palette.accent.blue}
            hideRules
            hideYAxisText
            hideAxesAndRules
            width={50}
            height={15}
            initialSpacing={0}
            spacing={5}
          />
        </View>
      )}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: { width: '48%', padding: 16, borderRadius: 24, marginBottom: 16, borderWidth: 1, elevation: 4, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, overflow: 'hidden' },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center' },
  trendContainer: { padding: 2 },
  label: { fontSize: 10, fontWeight: '700', marginLeft: 4, textTransform: 'uppercase', fontFamily: 'VarelaRound-Regular' },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  value: { fontSize: 24, fontWeight: 'bold', fontFamily: 'VarelaRound-Regular' },
  unit: { fontSize: 11, fontWeight: '500', fontFamily: 'VarelaRound-Regular' },
  sparklineWrapper: { marginTop: 6, height: 15, opacity: 0.5 },
});

export default MetricCard;
