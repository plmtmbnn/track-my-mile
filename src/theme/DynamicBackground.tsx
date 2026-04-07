import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { 
  useAnimatedProps, 
  useSharedValue, 
  withTiming, 
  interpolateColor 
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

interface DynamicBackgroundProps {
  speed: number;
}

const DynamicBackground = ({ speed }: DynamicBackgroundProps) => {
  const { palette } = useTheme();
  const intensity = useSharedValue(0);

  useEffect(() => {
    let target = 0;
    if (speed > 12) target = 3; // Elite
    else if (speed > 8) target = 2; // High
    else if (speed > 4) target = 1; // Medium
    else target = 0; // Low

    intensity.value = withTiming(target, { duration: 2000 });
  }, [speed]);

  const animatedProps = useAnimatedProps(() => {
    const color1 = interpolateColor(
      intensity.value,
      [0, 1, 2, 3],
      [palette.intensity.low[0], palette.intensity.medium[0], palette.intensity.high[0], palette.intensity.elite[0]]
    );
    const color2 = interpolateColor(
      intensity.value,
      [0, 1, 2, 3],
      [palette.intensity.low[1], palette.intensity.medium[1], palette.intensity.high[1], palette.intensity.elite[1]]
    );
    const color3 = interpolateColor(
      intensity.value,
      [0, 1, 2, 3],
      [palette.intensity.low[2], palette.intensity.medium[2], palette.intensity.high[2], palette.intensity.elite[2]]
    );

    return {
      colors: [color1, color2, color3],
    };
  });

  return (
    <AnimatedGradient
      animatedProps={animatedProps}
      style={styles.background}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      colors={palette.intensity.low} // Initial colors
    />
  );
};

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    width,
    height,
    zIndex: -1,
  },
});

export default DynamicBackground;
