import React, { useCallback } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CategoryCard } from '../components/CategoryCard';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNav = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNav;
}

interface Category {
  id: string;
  label: string;
  screen: keyof RootStackParamList;
}

const categories: Category[] = [
  { id: '1', label: 'Automações', screen: 'Automations' },
  { id: '2', label: 'Cenas', screen: 'Scenes' },
  { id: '3', label: 'Dispositivos', screen: 'Devices' },
  { id: '4', label: 'Integrações', screen: 'Integrations' },
];

/**
 * HomeScreen – 2×2 grid of category cards.
 * Matches reference: "MY HOUSE" title top-left, centered grid of 4 blue cards.
 */
export function HomeScreen({ navigation }: HomeScreenProps) {
  const handlePress = useCallback(
    (screen: keyof RootStackParamList) => {
      navigation.navigate(screen);
    },
    [navigation],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title top-left */}
        <View style={styles.header}>
          <Text style={styles.title}>MY HOUSE</Text>
        </View>

        {/* Centered Grid Area */}
        <View style={styles.gridWrapper}>
          <View style={styles.grid}>
            {categories.map((item) => (
              <CategoryCard
                key={item.id}
                label={item.label}
                onPress={() => handlePress(item.screen)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Platform.OS === 'web' ? undefined : 1,
  },
  scrollContent: {
    paddingHorizontal: 40,
    paddingBottom: 150, // Garante espaço para o chat
    flexGrow: 1,
  },
  header: {
    paddingTop: 20,
    alignItems: 'flex-start',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  gridWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // Using explicit width to ensure 2x2 on tablet
    width: '100%',
    maxWidth: 800,
    justifyContent: 'center',
    // RN Gap support (standard in recent versions)
    gap: 0, // We'll use CategoryCard padding for gap consistency if gap fails on older engines, but we'll try to use it here.
    // Actually, CategoryCard has width '50%', so we rely on its internal padding of 10 for a total gap of 20.
  },
});

