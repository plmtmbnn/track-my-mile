import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withTiming, 
  interpolateColor,
  useDerivedValue
} from 'react-native-reanimated';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

interface DynamicBackgroundProps {
  speed: number;
}

export const DynamicBackground = ({ speed }: DynamicBackgroundProps) => {
  const intensity = useSharedValue(0);

  useEffect(() => {
    // Map speed 0-18 to intensity 0-1
    intensity.value = withTiming(Math.min(speed / 15, 1), { duration: 1000 });
  }, [speed]);

  const animatedProps = useAnimatedProps(() => {
    const color1 = interpolateColor(
      intensity.value,
      [0, 0.3, 0.7, 1],
      ['#0F172A', '#064E3B', '#7F1D1D', '#4C1D95']
    );
    const color2 = interpolateColor(
      intensity.value,
      [0, 0.5, 1],
      ['#020617', '#022C22', '#450A0A']
    );

    return {
      colors: [color1, color2],
    };
  });

  return (
    <AnimatedGradient 
      animatedProps={animatedProps}
      style={StyleSheet.absoluteFill}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );
};

export default DynamicBackground;
