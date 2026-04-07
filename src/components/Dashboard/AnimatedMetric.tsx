import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  interpolate,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../theme/ThemeContext';

interface AnimatedMetricProps {
  label: string;
  value: number | string;
  unit: string;
  size?: 'large' | 'small';
  glowColor?: string;
  intensity?: number;
}

const AnimatedMetric = ({ label, value, unit, size = 'small', glowColor, intensity = 0 }: AnimatedMetricProps) => {
  const { palette } = useTheme();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.1, { damping: 10, stiffness: 100 }),
      withSpring(1, { damping: 10, stiffness: 100 })
    );
  }, [value]);

  useEffect(() => {
    glow.value = withTiming(intensity, { duration: 1000 });
  }, [intensity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      textShadowRadius: interpolate(glow.value, [0, 15], [0, 20]),
      textShadowColor: glowColor || palette.accent.blue,
    };
  });

  const isLarge = size === 'large';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: palette.text.secondary }]}>{label}</Text>
      <View style={styles.valueRow}>
        <Animated.Text 
          style={[
            isLarge ? styles.valueLarge : styles.valueSmall, 
            { color: palette.text.primary, fontFamily: 'VarelaRound-Regular' },
            animatedStyle
          ]}
        >
          {value}
        </Animated.Text>
        <Text style={[styles.unit, { color: palette.text.muted }]}> {unit}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueLarge: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  valueSmall: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AnimatedMetric;
