import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { AutomationsScreen } from '../screens/AutomationsScreen';

export type RootStackParamList = {
  Home: undefined;
  Automations: undefined;
  Scenes: undefined;
  Devices: undefined;
  Integrations: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Stack navigator with subtle fade transitions.
 * All screens share the same LayoutWrapper (gradient + chat)
 * because it wraps the NavigationContainer in App.tsx.
 */
export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
          cardStyle: { backgroundColor: 'transparent' },
          transitionSpec: {
            open: {
              animation: 'timing',
              config: { duration: 250 },
            },
            close: {
              animation: 'timing',
              config: { duration: 200 },
            },
          },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Automations" component={AutomationsScreen} />
        <Stack.Screen name="Scenes" component={AutomationsScreen} />
        <Stack.Screen name="Devices" component={AutomationsScreen} />
        <Stack.Screen name="Integrations" component={AutomationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
