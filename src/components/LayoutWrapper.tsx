import React, { useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatBar } from './ChatBar';
import { sendMessage } from '../services/api';
import { Colors } from '../theme/colors';

interface LayoutWrapperProps {
  children: React.ReactNode;
  onSendMessage?: (message: string) => Promise<string>;
}

/**
 * Global layout wrapper providing:
 * 1. Deep Purple → Illuminating Blue radial-like gradient background
 * 2. Persistent Floating ChatBar at the bottom
 */
export function LayoutWrapper({ children, onSendMessage }: LayoutWrapperProps) {
  const handleSend = useCallback(
    async (message: string) => {
      if (onSendMessage) {
        return onSendMessage(message);
      }
      return sendMessage(message);
    },
    [onSendMessage],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      
      {/* 1. Single Continuous High-Fidelity Background */}
      <LinearGradient
        colors={[
          '#4B0082', // Purple top-left corner
          '#3B006D', 
          '#4A6CF7', // Blue illuminated center/bottom
          '#6B8AFF', // Brighter blue base
        ]}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Glassy Overlay (subtle radial-like depth) */}
      <LinearGradient
        colors={['rgba(75, 0, 130, 0.15)', 'transparent', 'rgba(107, 138, 255, 0.15)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Screen content - Transparent by default */}
      <SafeAreaView style={styles.content} edges={['top', 'left', 'right']}>
        {children}
      </SafeAreaView>

      {/* Persistent Floating Chat Bar */}
      <ChatBar onSendMessage={handleSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#3B006D', // Fallback
  },
  content: {
    flex: 1,
  },
});


