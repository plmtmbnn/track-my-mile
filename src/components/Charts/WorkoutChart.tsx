import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../theme/ThemeContext';

interface ChartData {
  time: number;
  value: number;
}

interface WorkoutChartProps {
  data: ChartData[];
  label: string;
  unit: string;
}

const WorkoutChart = ({ data, label, unit }: WorkoutChartProps) => {
  const { theme, isDark } = useTheme();

  const chartData = data.map((d) => ({
    value: d.value,
    label: d.time.toString(),
  })).slice(-30); // Show last 30 data points for performance

  if (chartData.length < 2) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {label} ({unit})
      </Text>
      <LineChart
        areaChart
        curved
        data={chartData}
        height={150}
        spacing={20}
        initialSpacing={0}
        color={theme.primary}
        thickness={3}
        startFillColor={theme.primary}
        endFillColor={theme.primary}
        startOpacity={0.4}
        endOpacity={0.1}
        noOfSections={3}
        yAxisColor={theme.border}
        xAxisColor={theme.border}
        yAxisTextStyle={{ color: theme.subtext, fontSize: 10 }}
        hideDataPoints
        isAnimated
        animationDuration={500}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default WorkoutChart;
