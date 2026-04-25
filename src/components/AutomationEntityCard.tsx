// src/components/AutomationEntityCard.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDeviceControl } from '../hooks/useDeviceControl';
import { RoutineModal } from './RoutineModal';
import { HAEntity } from '../types';

interface AutomationEntityCardProps {
  routine: HAEntity;
  onRoutineDeleted?: (id: string) => void;
}

const getIconName = (mdiName: string | undefined) => {
  if (!mdiName) return 'robot';
  return mdiName.startsWith('mdi:') ? mdiName.replace('mdi:', '') : mdiName;
};

/**
 * Card de Automação Interativa.
 * Permite acessar configurações avançadas (RoutineModal) e reflete os metadados.
 */
export function AutomationEntityCard({ routine, onRoutineDeleted }: AutomationEntityCardProps) {
  const [modalVisible, setModalVisible] = React.useState(false);
  const isActive = routine.state === 'on';

  return (
    <>
      <RoutineModal 
         visible={modalVisible} 
         onClose={() => setModalVisible(false)} 
         routine={routine} 
         onDeleteSuccess={onRoutineDeleted}
      />
      <TouchableOpacity 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        style={[
          styles.card, 
          isActive ? styles.cardActive : styles.cardInactive
        ]}
      >
        <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name={getIconName(routine.attributes.icon) as any} 
                size={32} 
                color={isActive ? '#FFF' : '#6B4EE6'} 
              />
            </View>
          <View>
            <Text style={[styles.name, isActive && styles.textActive]} numberOfLines={1}>
              {routine.attributes.friendly_name || routine.entity_id}
            </Text>
            <Text style={[styles.status, isActive && styles.textActive]}>
              {isActive ? 'Ativa' : 'Desativada'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  card: { 
    padding: 16, 
    borderRadius: 20, 
    width: '46%', 
    margin: '2%', 
    minHeight: 110,
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, 
  },
  cardActive: { 
    backgroundColor: '#6B4EE6', // Roxo premium para diferenciar de dispositivos
  },
  cardInactive: { 
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  content: {
    alignItems: 'flex-start',
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
  }
});
