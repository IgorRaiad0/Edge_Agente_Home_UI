// src/components/SceneCard.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RoutineModal } from './RoutineModal';
import { HAEntity } from '../types';

interface SceneCardProps {
  routine: HAEntity;
  onRoutineDeleted?: (id: string) => void;
}

const getIconName = (mdiName: string | undefined) => {
  if (!mdiName) return 'movie-open';
  return mdiName.startsWith('mdi:') ? mdiName.replace('mdi:', '') : mdiName;
};

/**
 * Card de Cena Interativa.
 * Permite ativar ou abrir detalhes (RoutineModal).
 */
export function SceneCard({ routine, onRoutineDeleted }: SceneCardProps) {
  const [modalVisible, setModalVisible] = React.useState(false);

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
          styles.cardInactive
        ]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
              <MaterialCommunityIcons 
                name={getIconName(routine.attributes.icon) as any} 
                size={32} 
                color="#4A90E2" 
              />
          </View>
          
          <View>
            <Text style={styles.name} numberOfLines={1}>
              {routine.attributes.friendly_name || routine.entity_id}
            </Text>
            <Text style={styles.status}>
              Configurar / Ativar
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
  }
});
