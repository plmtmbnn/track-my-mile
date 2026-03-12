import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { COLORS, SPACING, RADIUS } from '@/constants/theme';

interface SpeedControlProps {
  targetSpeed: number;
  currentSpeed: number;
  minSpeed?: number;
  maxSpeed?: number;
  onIncrement: (delta: number) => void;
  onQuickSet: (speed: number) => void;
  disabled?: boolean;
}

const QUICK_SPEEDS = [4, 6, 8, 10, 12, 14, 16];

export const SpeedControl: React.FC<SpeedControlProps> = ({
  targetSpeed,
  currentSpeed,
  minSpeed = 0,
  maxSpeed = 20,
  onIncrement,
  onQuickSet,
  disabled,
}) => {
  return (
    <Surface style={styles.container} elevation={1}>
      <Text style={styles.sectionLabel}>Speed Control</Text>

      {/* Main +/- controls */}
      <View style={styles.mainControl}>
        <View style={styles.leftButtons}>
          <Button
            mode="outlined"
            onPress={() => onIncrement(-1)}
            disabled={disabled || targetSpeed <= minSpeed}
            compact
            style={styles.stepBtn}
            textColor={COLORS.danger}
            labelStyle={styles.stepLabel}
          >
            −1
          </Button>
          <Button
            mode="outlined"
            onPress={() => onIncrement(-0.1)}
            disabled={disabled || targetSpeed <= minSpeed}
            compact
            style={styles.stepBtn}
            textColor={COLORS.danger}
            labelStyle={styles.stepLabel}
          >
            −0.1
          </Button>
        </View>

        <View style={styles.targetDisplay}>
          <Text style={styles.targetLabel}>TARGET</Text>
          <Text style={styles.targetValue}>{targetSpeed.toFixed(1)}</Text>
          <Text style={styles.targetUnit}>km/h</Text>
          {Math.abs(currentSpeed - targetSpeed) > 0.15 && (
            <Text style={styles.currentIndicator}>
              actual {currentSpeed.toFixed(1)}
            </Text>
          )}
        </View>

        <View style={styles.rightButtons}>
          <Button
            mode="outlined"
            onPress={() => onIncrement(0.1)}
            disabled={disabled || targetSpeed >= maxSpeed}
            compact
            style={[styles.stepBtn, { borderColor: COLORS.success }]}
            textColor={COLORS.success}
            labelStyle={styles.stepLabel}
          >
            +0.1
          </Button>
          <Button
            mode="outlined"
            onPress={() => onIncrement(1)}
            disabled={disabled || targetSpeed >= maxSpeed}
            compact
            style={[styles.stepBtn, { borderColor: COLORS.success }]}
            textColor={COLORS.success}
            labelStyle={styles.stepLabel}
          >
            +1
          </Button>
        </View>
      </View>

      {/* Quick presets */}
      <View style={styles.quickRow}>
        {QUICK_SPEEDS.map((speed) => (
          <TouchableOpacity
            key={speed}
            style={[
              styles.quickBtn,
              Math.abs(targetSpeed - speed) < 0.05 && styles.quickBtnActive,
            ]}
            onPress={() => onQuickSet(speed)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.quickBtnText,
                Math.abs(targetSpeed - speed) < 0.05 && { color: COLORS.primary },
              ]}
            >
              {speed}
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
    gap: SPACING.xs,
  },
  leftButtons: { gap: SPACING.xs },
  rightButtons: { gap: SPACING.xs },
  stepBtn: {
    borderColor: COLORS.border,
    minWidth: 52,
  },
  stepLabel: { fontSize: 12, fontWeight: '700' },
  targetDisplay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    letterSpacing: -1,
    // @ts-ignore
    fontVariant: ['tabular-nums'],
    lineHeight: 32,
  },
  targetUnit: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  currentIndicator: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  quickRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  quickBtn: {
    paddingVertical: 5,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 36,
    alignItems: 'center',
  },
  quickBtnActive: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
