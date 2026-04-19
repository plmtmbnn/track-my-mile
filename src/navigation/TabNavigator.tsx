import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { WorkoutScreen } from '../screens/Workout/WorkoutScreen';
import { TrainingScreen } from '../screens/Training/TrainingScreen';
import { HistoryScreen } from '../screens/History/HistoryScreen';
import { Home, Activity, Trophy, Clock } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  const { palette } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: 'rgba(255,255,255,0.1)',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: palette.accent.blue,
        tabBarInactiveTintColor: palette.text.muted,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({ color }) => <Home size={24} color={color} /> }}
      />
      <Tab.Screen 
        name="Workout" 
        component={WorkoutScreen} 
        options={{ tabBarIcon: ({ color }) => <Activity size={24} color={color} /> }}
      />
      <Tab.Screen 
        name="Training" 
        component={TrainingScreen} 
        options={{ tabBarIcon: ({ color }) => <Trophy size={24} color={color} /> }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ tabBarIcon: ({ color }) => <Clock size={24} color={color} /> }}
      />
    </Tab.Navigator>
  );
};
