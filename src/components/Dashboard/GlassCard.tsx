import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const GlassCard = ({ children, style }: GlassCardProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.blurContainer}>
        {/* Fallback to semi-transparent background if blur is unavailable */}
        <View style={styles.overlay} />
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  blurContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  content: {
    padding: 16,
  },
});
