import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';
import type { ViewStyle } from 'react-native';

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  accent?: string;
  style?: ViewStyle;
  large?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  accent = COLORS.primary,
  style,
  large = false,
}) => {
  return (
    <Surface style={[styles.card, style]} elevation={1}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text
          style={[styles.value, large && styles.valueLarge, { color: accent }]}
          variant={large ? 'headlineMedium' : 'titleLarge'}
        >
          {value}
        </Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <View style={[styles.accentLine, { backgroundColor: accent }]} />
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    minWidth: 90,
    backgroundColor: COLORS.bgCard,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  value: {
    fontWeight: '800',
    letterSpacing: -0.5,
    // @ts-ignore - fontVariant is valid RN prop
    fontVariant: ['tabular-nums'],
    lineHeight: undefined,
  },
  valueLarge: {
    fontSize: 36,
  },
  unit: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.6,
  },
});
