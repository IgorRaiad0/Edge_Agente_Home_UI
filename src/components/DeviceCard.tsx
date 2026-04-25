// src/components/DeviceCard.tsx
import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  View,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DeviceGroup } from '../types';
import { DeviceDetailsModal } from './DeviceDetailsModal';

interface DeviceCardProps {
  device: DeviceGroup;
}

/**
 * Utilitário para limpar o nome do ícone (mdi:lamp -> lamp)
 */
const getIconName = (mdiName: string) => {
  if (!mdiName) return 'help-circle-outline';
  return mdiName.startsWith('mdi:') ? mdiName.replace('mdi:', '') : mdiName;
};

/**
 * Card de Dispositivo Agrupado com suporte a ícones reais.
 */
export function DeviceCard({ device }: DeviceCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const isCamera = device.main_entity?.domain === 'camera';
  const isActive = isCamera
    ? device.main_entity?.state !== 'unavailable'
    : device.main_entity?.state === 'on';

  const statusLabel = isCamera
    ? (device.main_entity?.state === 'idle' ? 'Ao vivo' : device.main_entity?.state ?? 'Indisponível')
    : (isActive ? 'Ligado' : 'Desligado');

  const handlePress = () => {
    setModalVisible(true);
  };

  return (
    <>
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.7}
        style={[
          styles.card, 
          isActive ? styles.cardActive : styles.cardInactive
        ]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={getIconName(device.icon) as any} 
              size={32} 
              color={isActive ? '#FFF' : '#4A6CF7'} 
            />
          </View>
          
          <View>
            <Text style={[styles.name, isActive && styles.textActive]} numberOfLines={1}>
              {device.name}
            </Text>
            <Text style={styles.debugId}># {device.id}</Text>
            <Text style={[styles.status, isActive && styles.textActive]}>
              {statusLabel}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Modal de Detalhes (Grouped Entities) */}
      <DeviceDetailsModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        device={device}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: { 
    padding: 16, 
    borderRadius: 20, 
    width: '46%', 
    margin: '2%', 
    minHeight: 100,
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, 
    borderWidth: 2,
    borderColor: '#4A6CF7', // Borda azul para confirmar carregamento do código
  },
  cardActive: { 
    backgroundColor: '#4A6CF7', // Azul premium para ativo
  },
  cardInactive: { 
    backgroundColor: '#FFFFFF', // Branco para inativo
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  content: {
    alignItems: 'flex-start',
  },
  loader: {
    marginBottom: 10,
    height: 30, 
  },
  iconContainer: {
    marginBottom: 12,
  },
  name: { 
    fontWeight: '700', 
    fontSize: 15,
    marginBottom: 2,
    color: '#333',
  },
  status: { 
    fontSize: 12, 
    opacity: 0.6,
    color: '#666',
  },
  textActive: { 
    color: '#FFFFFF',
    opacity: 1,
  },
  debugId: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.3)',
    marginBottom: 2,
  }
});
