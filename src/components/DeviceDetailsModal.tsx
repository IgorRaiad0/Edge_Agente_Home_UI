import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  StatusBar,
  Platform,
  TextInput,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DeviceGroup, SubEntity } from '../types';
import { api } from '../services/api';
import { CameraManagerView } from './camera/CameraManagerView';

interface Props {
  visible: boolean;
  onClose: () => void;
  device: DeviceGroup | null;
}

// Lista de ícones sugeridos para personalização rápida
const SUGGESTED_ICONS = [
  'lightbulb', 'camera', 'power', 'television', 'fan', 
  'lock', 'thermometer', 'motion-sensor', 'window-shutter', 
  'water', 'weather-sunny', 'cctv', 'led-variant', 'chandelier'
];

/**
 * Utilitário para formatar o nome do ícone
 */
const getIconName = (mdiName: string) => {
  if (!mdiName) return 'help-circle-outline';
  return mdiName.startsWith('mdi:') ? mdiName.replace('mdi:', '') : mdiName;
};

/**
 * Componente de Modal que exibe os detalhes de um grupo de dispositivos.
 * Suporta RENOMEAÇÃO e PERSONALIZAÇÃO DE ÍCONES.
 */
export function DeviceDetailsModal({ visible, onClose, device }: Props) {
  const [localEntities, setLocalEntities] = useState<SubEntity[]>(device?.entities || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [customIcon, setCustomIcon] = useState("");

  useEffect(() => {
    if (device?.entities) {
      setLocalEntities(device.entities);
    }
  }, [device]);

  if (!device) return null;

  // Procura câmera disponível no grupo, priorizando state !== unavailable
  const cameraEntity = device.entities
    .filter(e => e.domain === 'camera')
    .sort((a, b) => (a.state === 'unavailable' ? 1 : -1))
    .find(Boolean) ?? (device.main_entity?.domain === 'camera' ? device.main_entity : null);
  const handleToggle = async (entity_id: string, currentState: string) => {
    const newState = currentState === 'on' ? 'off' : 'on';
    setLocalEntities(prev => 
      prev.map(e => e.entity_id === entity_id ? { ...e, state: newState } : e)
    );

    try {
      await api.post('/devices/execute', {
        entity_id: entity_id,
        service: newState === 'on' ? 'turn_on' : 'turn_off'
      });
    } catch (error) {
      console.error("Erro ao alternar:", error);
    }
  };

  const handleUpdateDevice = async (entity_id: string, name?: string, icon?: string) => {
    try {
      await api.post('/devices/update', {
        entity_id: entity_id,
        name: name?.trim(),
        icon: icon ? `mdi:${icon}` : undefined
      });
      setEditingId(null);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      setEditingId(null);
    }
  };

  const renderSubEntity = (entity: SubEntity) => {
    const isToggleable = ['switch', 'light', 'input_boolean', 'fan'].includes(entity.domain);
    const currentEntity = localEntities.find(e => e.entity_id === entity.entity_id) || entity;
    const isOn = currentEntity.state === 'on';
    const isEditing = editingId === entity.entity_id;

    return (
      <View key={entity.entity_id} style={styles.entityRow}>
        <View style={styles.entityInfo}>
          {isEditing ? (
            <View style={styles.editWrapper}>
              <TextInput
                style={styles.nameInput}
                value={tempName}
                onChangeText={setTempName}
                autoFocus
                onBlur={() => handleUpdateDevice(entity.entity_id, tempName)}
                onSubmitEditing={() => handleUpdateDevice(entity.entity_id, tempName)}
              />
              <TouchableOpacity 
                onPress={() => handleUpdateDevice(entity.entity_id, tempName)}
                style={styles.saveButtonSmall}
              >
                <Text style={styles.saveIcon}>✓</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => { setEditingId(entity.entity_id); setTempName(currentEntity.name); }}
              style={styles.nameTouchable}
            >
              <Text style={styles.entityName}>{currentEntity.name} <Text style={styles.editIcon}>✎</Text></Text>
            </TouchableOpacity>
          )}
          <Text style={styles.entityDomain}>{currentEntity.domain}</Text>
        </View>

        {isToggleable ? (
          <Switch 
            value={isOn} 
            onValueChange={() => handleToggle(entity.entity_id, currentEntity.state)} 
            trackColor={{ false: '#3D3D4D', true: '#4A6CF7' }}
            thumbColor={isOn ? '#FFF' : '#A0A0A0'}
          />
        ) : (
          <Text style={styles.entityState}>{currentEntity.state}</Text>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.dismissArea} onPress={onClose} activeOpacity={1} />
        
        <View style={styles.modalContent}>
          <View style={styles.pullIndicator} />
          
          <View style={styles.header}>
            <View style={styles.titleWrapper}>
               <MaterialCommunityIcons 
                 name={getIconName(device.icon) as any} 
                 size={32} 
                 color="#4A6CF7" 
                 style={{ marginRight: 12 }}
               />
               
               {editingId === 'header' ? (
                 <View style={styles.editWrapper}>
                   <TextInput
                     style={[styles.title, styles.titleInput]}
                     value={tempName}
                     onChangeText={setTempName}
                     autoFocus
                     onBlur={() => handleUpdateDevice(device.main_entity?.entity_id || '', tempName)}
                     onSubmitEditing={() => handleUpdateDevice(device.main_entity?.entity_id || '', tempName)}
                   />
                   <TouchableOpacity 
                     onPress={() => handleUpdateDevice(device.main_entity?.entity_id || '', tempName)}
                     style={styles.saveButton}
                   >
                     <Text style={styles.saveIcon}>✓</Text>
                   </TouchableOpacity>
                 </View>
               ) : (
                 <TouchableOpacity onPress={() => { setEditingId('header'); setTempName(device.name); }}>
                   <Text style={styles.title}>{device.name} <Text style={styles.editIconHeader}>✎</Text></Text>
                 </TouchableOpacity>
               )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Secão de Personalização de Ícones */}
            <Text style={styles.sectionTitle}>Personalizar Ícone</Text>
            
            <View style={styles.customIconContainer}>
              <MaterialCommunityIcons 
                name={getIconName(customIcon || device.icon) as any} 
                size={24} 
                color="#4A6CF7" 
                style={styles.customIconPreview}
              />
              <TextInput
                style={styles.customIconInput}
                placeholder="Ex: sofa, robot-vacuum"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={customIcon}
                onChangeText={setCustomIcon}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={styles.saveCustomIconButton}
                onPress={() => {
                  if (customIcon.trim()) {
                    handleUpdateDevice(device.main_entity?.entity_id || '', undefined, customIcon.trim());
                    setCustomIcon("");
                  }
                }}
              >
                <Text style={styles.saveIcon}>✓</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={SUGGESTED_ICONS}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.iconPickerItem,
                    getIconName(device.icon) === item && styles.iconPickerItemActive
                  ]}
                  onPress={() => handleUpdateDevice(device.main_entity?.entity_id || '', undefined, item)}
                >
                  <MaterialCommunityIcons name={item as any} size={24} color={getIconName(device.icon) === item ? '#FFF' : '#64648C'} />
                </TouchableOpacity>
              )}
              style={styles.iconList}
            />

            {cameraEntity ? (
              <View style={styles.cameraContainer}>
                <CameraManagerView entityId={cameraEntity.entity_id} entities={device.entities} />
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Controles e Sensores</Text>
                {device.entities.map(renderSubEntity)}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'flex-end' 
  },
  dismissArea: {
    flex: 1,
  },
  modalContent: { 
    backgroundColor: '#1E1E2C', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    height: '75%', 
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20
  },
  pullIndicator: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 20
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 30 
  },
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    fontSize: 28,
    marginRight: 12
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#FFF' 
  },
  titleInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#4A6CF7',
    minWidth: 200,
    paddingVertical: 0,
  },
  editIconHeader: {
    fontSize: 16,
    color: '#4A6CF7',
    marginLeft: 8,
  },
  closeButton: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 20 
  },
  closeText: { 
    fontWeight: '600', 
    color: '#AAA' 
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A6CF7',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 15
  },
  iconList: {
    marginBottom: 20,
  },
  iconPickerItem: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconPickerItemActive: {
    backgroundColor: '#4A6CF7',
  },
  customIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  customIconPreview: {
    marginRight: 10,
  },
  customIconInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  saveCustomIconButton: {
    backgroundColor: '#4A6CF7',
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  scrollContent: { 
    paddingBottom: 40 
  },
  cameraContainer: {
    height: 700,
  },
  entityRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 18, 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.05)' 
  },
  entityInfo: { 
    flex: 1 
  },
  editWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  saveButton: {
    marginLeft: 10,
    backgroundColor: '#4A6CF7',
    padding: 8,
    borderRadius: 12,
  },
  saveButtonSmall: {
    marginLeft: 10,
    backgroundColor: '#4A6CF7',
    padding: 6,
    borderRadius: 10,
  },
  saveIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  entityName: { 
    fontSize: 17, 
    color: '#FFF', 
    fontWeight: '500' 
  },
  nameInput: {
    color: '#4A6CF7',
    fontSize: 17,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#4A6CF7',
    paddingVertical: 2,
    minWidth: 150,
  },
  nameTouchable: {
    paddingVertical: 2,
  },
  editIcon: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
  },
  entityDomain: { 
    fontSize: 13, 
    color: '#64648C', 
    marginTop: 4 
  },
  entityState: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#4A6CF7' 
  }
});
