import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Platform } from 'react-native';
import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { AutomationsScreen } from '../screens/AutomationsScreen';
import { DevicesScreen } from '../screens/DevicesScreen';
import { ScenesScreen } from '../screens/ScenesScreen';

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
          cardStyle: { 
            backgroundColor: 'transparent',
            flex: 1,
            overflow: Platform.OS === 'web' ? ('visible' as any) : undefined
          },
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
        <Stack.Screen name="Scenes" component={ScenesScreen} />
        <Stack.Screen name="Devices" component={DevicesScreen} />
        <Stack.Screen name="Integrations" component={AutomationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
