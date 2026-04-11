import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { MotiView, MotiText } from 'moti';

interface AnimatedMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  isFocused?: boolean;
}

export const AnimatedMetric = ({ label, value, unit, isFocused }: AnimatedMetricProps) => {
  return (
    <MotiView
      animate={{
        scale: isFocused ? 1.2 : 1,
        opacity: 1,
      }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.container}
    >
      <Text style={styles.label}>{label}</Text>
      <MotiView style={styles.valueRow}>
        <MotiText 
          animate={{ fontSize: isFocused ? 64 : 42 }}
          style={styles.value}
        >
          {value}
        </MotiText>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </MotiView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  unit: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 18,
    marginLeft: 4,
    fontWeight: '600',
  },
});
