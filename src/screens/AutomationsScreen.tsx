import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  AutomationCard,
  AutomationCardSkeleton,
} from '../components/AutomationCard';
import { useAutomations } from '../hooks/useAutomations';
import { Colors } from '../theme/colors';
import { RootStackParamList } from '../navigation/AppNavigator';

// Title map for reusing this screen for different categories
const TITLE_MAP: Record<string, string> = {
  Automations: 'Automações',
  Scenes: 'Cenas',
  Devices: 'Dispositivos',
  Integrations: 'Integrações',
};

const SKELETON_DATA = Array.from({ length: 32 }, (_, i) => ({
  id: `skel-${i}`,
}));

/**
 * AutomationsScreen – 8-column grid with search bar.
 * Reused for Scenes/Devices/Integrations with different titles.
 */
export function AutomationsScreen({ navigation, route }: any) {
  const screenName = route.name as string;
  const title = TITLE_MAP[screenName] || screenName;
  const { filteredAutomations, isLoading, search, setSearch } = useAutomations();

  const renderItem = useCallback(
    ({ item, index }: { item: { id: string; label: string }; index: number }) => (
      <AutomationCard
        label={item.label}
        index={index}
        onPress={() => {
          // TODO: handle automation tap
        }}
      />
    ),
    [],
  );

  const renderSkeleton = useCallback(
    ({ item, index }: { item: { id: string }; index: number }) => (
      <AutomationCardSkeleton index={index} />
    ),
    [],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          hitSlop={12}
        >
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar"
          placeholderTextColor="rgba(100,100,140,0.5)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Grid */}
      <View style={styles.gridWrapper}>
        {isLoading ? (
          <FlatList
            data={SKELETON_DATA}
            keyExtractor={(item) => item.id}
            renderItem={renderSkeleton}
            numColumns={8}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContent}
          />
        ) : (
          <FlatList
            data={filteredAutomations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={8}
            scrollEnabled={true}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 16,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  backText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginRight: 60, // offset for the back button width
  },
  headerSpacer: {
    width: 0,
  },
  searchContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    width: '65%',
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  gridWrapper: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
});
