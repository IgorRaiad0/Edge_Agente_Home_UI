// src/screens/DevicesScreen.tsx
import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { DeviceCard } from '../components/DeviceCard';
import { useAutomations } from '../hooks/useAutomations';
import { DeviceGroup } from '../types';

/**
 * Tela dedicada para Dispositivos Interativos (Agrupados).
 * Layout de 2 colunas com suporte a Toque Longo para detalhes.
 */
export function DevicesScreen({ navigation }: any) {
  const { filteredEntities, isLoading, search, setSearch } = useAutomations('Devices');

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      // Como o useAutomations retorna (HAEntity | DeviceGroup)[], 
      // garantimos que o item passado ao DeviceCard é um DeviceGroup.
      const device = item as DeviceGroup;
      
      return (
        <DeviceCard device={device} />
      );
    },
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
        >
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Dispositivos Interativos</Text>
        <View style={styles.spacer} />
      </View>

      {/* Busca */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar dispositivos..."
          placeholderTextColor="rgba(100,100,140,0.5)"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Lista de Dispositivos Agrupados */}
      <View style={styles.listWrapper}>
        <FlatList
          data={filteredEntities}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          numColumns={2}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          ListEmptyComponent={
            !isLoading ? (
              <Text style={styles.emptyText}>Nenhum dispositivo encontrado.</Text>
            ) : null
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 20,
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
  listWrapper: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 220, 
    flexGrow: 1,
  },
  emptyText: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 50,
    opacity: 0.7,
  }
});
