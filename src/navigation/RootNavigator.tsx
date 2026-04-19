import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TabNavigator } from './TabNavigator';
import { ConnectScreen } from '../screens/Connect/ConnectScreen';
import { HistoryDetailScreen } from '../screens/History/HistoryDetailScreen';

const Stack = createStackNavigator();

export const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Connect" component={ConnectScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
