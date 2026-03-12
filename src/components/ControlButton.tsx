import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { COLORS } from '@/constants/theme';
import type { ViewStyle } from 'react-native';

type Variant = 'primary' | 'success' | 'danger' | 'warning' | 'ghost' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

interface ControlButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: string; // Material icon name for react-native-paper
  style?: ViewStyle;
  size?: Size;
}

const VARIANT_COLOR: Record<Variant, string> = {
  primary: COLORS.primary,
  success: COLORS.success,
  danger: COLORS.danger,
  warning: COLORS.warning,
  ghost: COLORS.textSecondary,
  secondary: COLORS.textPrimary,
};

const VARIANT_MODE: Record<Variant, 'contained' | 'outlined' | 'text'> = {
  primary: 'contained',
  success: 'contained',
  danger: 'contained',
  warning: 'contained',
  ghost: 'outlined',
  secondary: 'outlined',
};

export const ControlButton: React.FC<ControlButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  style,
  size = 'md',
}) => {
  const accentColor = VARIANT_COLOR[variant];
  const mode = VARIANT_MODE[variant];

  return (
    <Button
      mode={mode}
      onPress={onPress}
      disabled={disabled || loading}
      loading={loading}
      icon={icon}
      style={[styles.base, SIZE_STYLES[size].button, style]}
      contentStyle={SIZE_STYLES[size].content}
      labelStyle={[styles.label, SIZE_STYLES[size].label]}
      buttonColor={mode === 'contained' ? accentColor : undefined}
      textColor={mode === 'contained'
        ? (variant === 'danger' ? '#fff' : '#08090f')
        : accentColor
      }
      rippleColor={`${accentColor}33`}
    >
      {label}
    </Button>
  );
};

const SIZE_STYLES = {
  sm: {
    button: { borderRadius: 8 },
    content: { height: 32, paddingHorizontal: 4 },
    label: { fontSize: 12, letterSpacing: 0.3 },
  },
  md: {
    button: { borderRadius: 10 },
    content: { height: 40, paddingHorizontal: 8 },
    label: { fontSize: 14, letterSpacing: 0.3 },
  },
  lg: {
    button: { borderRadius: 12 },
    content: { height: 48, paddingHorizontal: 12 },
    label: { fontSize: 16, letterSpacing: 0.3 },
  },
};

const styles = StyleSheet.create({
  base: {
    borderColor: COLORS.border,
  },
  label: {
    fontWeight: '700',
  },
});
