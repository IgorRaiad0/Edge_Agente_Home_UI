import './global.css';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LayoutWrapper } from './src/components/LayoutWrapper';
import { AppNavigator } from './src/navigation/AppNavigator';

/**
 * Root App component.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LayoutWrapper>
          <AppNavigator />
        </LayoutWrapper>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

