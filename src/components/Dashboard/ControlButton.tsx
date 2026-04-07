import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '../../theme/ThemeContext';

interface ControlButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  color: string;
  isActive?: boolean;
}

const ControlButton = ({ onPress, icon, label, color, isActive = true }: ControlButtonProps) => {
  const { palette } = useTheme();

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      style={styles.wrapper}
    >
      <MotiView
        animate={{ 
          scale: isActive ? 1 : 0.8,
          opacity: isActive ? 1 : 0.5,
          shadowOpacity: isActive ? 0.6 : 0.2,
        }}
        style={[
          styles.button, 
          { 
            backgroundColor: palette.glass.background,
            borderColor: color,
            shadowColor: color,
          }
        ]}
      >
        {icon}
      </MotiView>
      <Text style={[styles.label, { color: palette.text.secondary }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
  },
  label: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  }
});

export default ControlButton;
