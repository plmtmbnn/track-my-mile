import { Platform } from 'react-native';
import { MD3DarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// ─── Core color palette ───────────────────────────────────────────────────────
export const COLORS = {
  bg: '#08090f',
  bgCard: '#0f1118',
  bgElevated: '#151722',
  bgHighlight: '#1c2030',

  primary: '#00d4ff',
  primaryDim: '#0099bb',
  primaryGlow: 'rgba(0, 212, 255, 0.15)',

  success: '#00ff88',
  successDim: '#00bb66',
  successGlow: 'rgba(0, 255, 136, 0.15)',

  warning: '#ffb800',
  warningGlow: 'rgba(255, 184, 0, 0.15)',

  danger: '#ff3355',
  dangerGlow: 'rgba(255, 51, 85, 0.15)',

  textPrimary: '#ffffff',
  textSecondary: '#8892a4',
  textMuted: '#4a5568',

  border: '#1e2438',
  borderActive: '#2d3a55',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
} as const;

// ─── React Native Paper MD3 dark theme override ───────────────────────────────
export const paperTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Map our palette to MD3 color roles
    primary: COLORS.primary,
    onPrimary: '#08090f',
    primaryContainer: COLORS.primaryGlow,
    onPrimaryContainer: COLORS.primary,

    secondary: COLORS.success,
    onSecondary: '#08090f',
    secondaryContainer: COLORS.successGlow,
    onSecondaryContainer: COLORS.success,

    tertiary: COLORS.warning,
    onTertiary: '#08090f',

    error: COLORS.danger,
    onError: '#ffffff',
    errorContainer: COLORS.dangerGlow,
    onErrorContainer: COLORS.danger,

    background: COLORS.bg,
    onBackground: COLORS.textPrimary,

    surface: COLORS.bgCard,
    onSurface: COLORS.textPrimary,
    surfaceVariant: COLORS.bgElevated,
    onSurfaceVariant: COLORS.textSecondary,

    outline: COLORS.border,
    outlineVariant: COLORS.borderActive,

    inverseSurface: COLORS.textPrimary,
    inverseOnSurface: COLORS.bg,
    inversePrimary: COLORS.primaryDim,

    elevation: {
      level0: 'transparent',
      level1: COLORS.bgCard,
      level2: COLORS.bgElevated,
      level3: COLORS.bgHighlight,
      level4: '#202435',
      level5: '#252840',
    },

    surfaceDisabled: 'rgba(255,255,255,0.06)',
    onSurfaceDisabled: 'rgba(255,255,255,0.26)',
    backdrop: 'rgba(0,0,0,0.6)',
  },
};
