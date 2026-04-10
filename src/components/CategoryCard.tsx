import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface CategoryCardProps {
  label: string;
  onPress: () => void;
}

/**
 * High-fidelity category card for the HomeScreen 2×2 grid.
 * - Solid vibrant blue (#2D3ED2)
 * - Aspect Ratio 1:1
 * - Border Radius 32
 */
export function CategoryCard({ label, onPress }: CategoryCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 15, stiffness: 200 }) }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = 0.95; }}
      onPressOut={() => { scale.value = 1; }}
      onPress={onPress}
      style={styles.pressable}
    >
      <Animated.View 
        style={[styles.card, animatedStyle]}
      >
        <Text style={styles.label}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    padding: 10,
    width: '50%',
    aspectRatio: 1,
  },
  card: {
    flex: 1,
    backgroundColor: '#2D3ED2',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    // Premium shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});

