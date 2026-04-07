import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../../theme/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animate?: any;
  delay?: number;
  glowColor?: string;
}

const GlassCard = ({ children, style, animate, delay = 0, glowColor }: GlassCardProps) => {
  const { palette } = useTheme();

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95, translateY: 10 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        translateY: 0,
        ...animate 
      }}
      transition={{ type: 'spring', delay }}
      style={[
        styles.card, 
        { 
          backgroundColor: palette.glass.background,
          borderColor: palette.glass.border,
          shadowColor: glowColor || '#000',
          shadowOpacity: glowColor ? 0.5 : 0.25,
          shadowRadius: glowColor ? 15 : 10,
        },
        style
      ]}
    >
      <View style={styles.reflection} />
      {children}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
  },
  reflection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ skewY: '-5deg' }, { translateY: -10 }],
  }
});

export default GlassCard;
