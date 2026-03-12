import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import Svg, { Rect } from 'react-native-svg';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';

interface InclinationControlProps {
  targetInclination: number;
  currentInclination: number;
  minInclination?: number;
  maxInclination?: number;
  onIncrement: (delta: number) => void;
  disabled?: boolean;
}

function InclinationVisual({ inclination }: { inclination: number }) {
  const clamp = Math.max(-3, Math.min(15, inclination));
  const pct = (clamp + 3) / 18;
  const barHeight = 6 + pct * 50;
  const barColor = clamp > 0 ? COLORS.warning : clamp < 0 ? COLORS.primary : COLORS.textMuted;

  return (
    <Svg width={30} height={70} viewBox="0 0 30 70">
      <Rect x={10} y={5} width={10} height={60} rx={5} fill={COLORS.bgHighlight} />
      <Rect x={10} y={65 - barHeight} width={10} height={barHeight} rx={4} fill={barColor} />
    </Svg>
  );
}

const QUICK_INCLINES = [-2, 0, 1, 2, 3, 5, 8, 10, 12];

export const InclinationControl: React.FC<InclinationControlProps> = ({
  targetInclination,
  currentInclination,
  minInclination = -3,
  maxInclination = 15,
  onIncrement,
  disabled,
}) => {
  return (
    <Surface style={styles.container} elevation={1}>
      <Text style={styles.sectionLabel}>Inclination</Text>

      <View style={styles.mainControl}>
        <InclinationVisual inclination={currentInclination} />

        <View style={styles.displayArea}>
          <Text style={styles.targetLabel}>TARGET</Text>
          <Text
            style={[
              styles.targetValue,
              targetInclination > 0 && { color: COLORS.warning },
            ]}
          >
            {targetInclination > 0 ? '+' : ''}
            {targetInclination.toFixed(1)}
          </Text>
          <Text style={styles.targetUnit}>%</Text>
        </View>

        <View style={styles.buttons}>
          <Button
            mode="outlined"
            compact
            onPress={() => onIncrement(1)}
            disabled={disabled || targetInclination >= maxInclination}
            textColor={COLORS.warning}
            style={[styles.incBtn, { borderColor: COLORS.warning }]}
            labelStyle={styles.incLabel}
            icon="chevron-up"
          >
            +1
          </Button>
          <Button
            mode="outlined"
            compact
            onPress={() => onIncrement(0.5)}
            disabled={disabled || targetInclination >= maxInclination}
            textColor={COLORS.warning}
            style={[styles.incBtn, { borderColor: COLORS.warning }]}
            labelStyle={styles.incLabel}
          >
            +0.5
          </Button>
          <Button
            mode="outlined"
            compact
            onPress={() => onIncrement(-0.5)}
            disabled={disabled || targetInclination <= minInclination}
            textColor={COLORS.primary}
            style={[styles.incBtn, { borderColor: COLORS.primary }]}
            labelStyle={styles.incLabel}
          >
            -0.5
          </Button>
          <Button
            mode="outlined"
            compact
            onPress={() => onIncrement(-1)}
            disabled={disabled || targetInclination <= minInclination}
            textColor={COLORS.primary}
            style={[styles.incBtn, { borderColor: COLORS.primary }]}
            labelStyle={styles.incLabel}
            icon="chevron-down"
          >
            -1
          </Button>
        </View>
      </View>

      {/* Quick presets */}
      <View style={styles.quickRow}>
        {QUICK_INCLINES.map((inc) => (
          <TouchableOpacity
            key={inc}
            style={[
              styles.quickBtn,
              Math.abs(targetInclination - inc) < 0.05 && styles.quickBtnActive,
            ]}
            onPress={() => onIncrement(inc - targetInclination)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.quickBtnText,
                Math.abs(targetInclination - inc) < 0.05 && { color: COLORS.warning },
              ]}
            >
              {inc > 0 ? `+${inc}` : inc}%
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    gap: SPACING.sm,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  mainControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  displayArea: { flex: 1, alignItems: 'center' },
  targetLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  targetValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
    // @ts-ignore
    fontVariant: ['tabular-nums'],
    lineHeight: 32,
  },
  targetUnit: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  buttons: { gap: SPACING.xs },
  incBtn: { minWidth: 60 },
  incLabel: { fontSize: 11, fontWeight: '700' },
  quickRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap' },
  quickBtn: {
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickBtnActive: {
    backgroundColor: COLORS.warningGlow,
    borderColor: COLORS.warning,
  },
  quickBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
