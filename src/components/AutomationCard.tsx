import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';

interface AutomationCardProps {
  label: string;
  index: number;
  onPress?: () => void;
}

/**
 * Small grid card for the AutomationsScreen 8-column grid.
 * Staggered fade-in on mount + subtle press animation.
 */
export function AutomationCard({ label, index, onPress }: AutomationCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 15, stiffness: 200 }) }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = 0.92; }}
      onPressOut={() => { scale.value = 1; }}
      onPress={onPress}
      style={styles.pressable}
    >
      <Animated.View
        entering={FadeIn.delay(index * 30).duration(300)}
        style={[styles.card, animatedStyle]}
      >
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/** Skeleton placeholder for loading state */
export function AutomationCardSkeleton({ index }: { index: number }) {
  return (
    <View style={styles.pressable}>
      <Animated.View
        entering={FadeIn.delay(index * 20).duration(200)}
        style={[styles.card, styles.skeleton]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    maxWidth: '12.5%', // 100% / 8 columns
    aspectRatio: 1.1,
    padding: 4,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.cardGrid,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  skeleton: {
    backgroundColor: 'rgba(91, 110, 245, 0.4)',
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});
