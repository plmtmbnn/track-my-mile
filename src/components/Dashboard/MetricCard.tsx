import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MotiView, MotiText } from 'moti';
import { useTheme } from '../../theme/ThemeContext';

interface MetricCardProps {
  label: string;
  value: number | string | undefined;
  unit: string;
  icon?: React.ReactNode;
  highlightTrigger?: any;
}

const MetricCard = ({ label, value, unit, icon, highlightTrigger }: MetricCardProps) => {
  const { theme } = useTheme();
  const [highlightColor, setHighlightColor] = useState<string | null>(null);

  useEffect(() => {
    if (highlightTrigger !== undefined) {
      setHighlightColor(theme.primary);
      const timer = setTimeout(() => setHighlightColor(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [highlightTrigger, theme.primary]);

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        backgroundColor: highlightColor || theme.card
      }}
      transition={{ type: 'spring' }}
      style={[styles.container, { shadowColor: theme.text }]}
    >
      <View style={styles.header}>
        {icon}
        <Text style={[styles.label, { color: theme.subtext }]}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <MotiText
          style={[styles.value, { color: highlightColor ? '#FFF' : theme.text }]}
        >
          {typeof value === 'number' ? value.toFixed(1) : (value || '--')}
        </MotiText>
        <Text style={[styles.unit, { color: theme.subtext }]}> {unit}</Text>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MetricCard;
