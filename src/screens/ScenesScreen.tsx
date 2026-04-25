import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SceneCard } from '../components/SceneCard';
import { useAutomations } from '../hooks/useAutomations';
import { HAEntity } from '../types';

/**
 * Tela dedicada para Cenas.
 * Usa ScrollView + flexWrap para garantir scroll perfeito em Web e Mobile.
 */
export function ScenesScreen({ navigation }: any) {
  const { filteredEntities, isLoading, search, setSearch, refresh } = useAutomations('Scenes');

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
        >
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Cenas do Sistema</Text>
        <View style={styles.spacer} />
      </View>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar cenas..."
          placeholderTextColor="rgba(100,100,140,0.5)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Lista de Cenas — ScrollView + flexWrap funciona em Web e Mobile */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.grid}>
          {(filteredEntities as HAEntity[]).map((item) => (
            <SceneCard
              key={item.entity_id}
              routine={item}
              onRoutineDeleted={() => refresh()}
            />
          ))}
          {!isLoading && filteredEntities.length === 0 && (
            <Text style={styles.emptyText}>Nenhuma cena encontrada.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: Platform.OS === 'web' ? undefined : 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  backButtonPressed: {
    opacity: 0.5,
  },
  backText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginRight: 50,
  },
  spacer: {
    width: 0,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 12,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 220,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyText: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 50,
    opacity: 0.7,
    width: '100%',
  },
});
