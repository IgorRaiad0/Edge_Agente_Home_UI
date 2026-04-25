import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  TextInput,
  FlatList,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HAEntity } from '../types';
import { api } from '../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  routine: HAEntity | null;
  onDeleteSuccess?: (entity_id: string) => void;
}

const SUGGESTED_ICONS = [
  'script-text', 'robot', 'clock-outline', 'home-automation', 'movie-open', 
  'weather-night', 'weather-sunny', 'shield-home', 'power-sleep', 'alert'
];

const getIconName = (mdiName: string | undefined) => {
  if (!mdiName) return 'help-circle-outline';
  return mdiName.startsWith('mdi:') ? mdiName.replace('mdi:', '') : mdiName;
};

export function RoutineModal({ visible, onClose, routine, onDeleteSuccess }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  const [customIcon, setCustomIcon] = useState("");

  useEffect(() => {
    if (routine) {
      setTempDescription(routine.description || "");
    }
  }, [routine]);

  if (!routine) return null;

  const isAutomation = routine.entity_id.startsWith('automation.');
  const isOn = routine.state === 'on';

  const handleUpdate = async (updates: { name?: string, icon?: string, description?: string }) => {
    try {
      await api.post('/devices/update', {
        entity_id: routine.entity_id,
        ...updates
      });
      setEditingId(null);
    } catch (error) {
      console.error("Erro ao atualizar rotina:", error);
    }
  };

  const handleToggle = async () => {
    const newState = isOn ? 'off' : 'on';
    try {
      await api.post('/devices/execute', {
        entity_id: routine.entity_id,
        service: newState === 'on' ? 'turn_on' : 'turn_off'
      });
    } catch (error) {
      console.error("Erro ao alternar rotina:", error);
    }
  };

  const handleExecute = async () => {
    try {
      if (isAutomation) {
        await api.post('/devices/execute', { entity_id: routine.entity_id, service: 'trigger' });
      } else {
        await api.post('/devices/execute', { entity_id: routine.entity_id, service: 'turn_on' });
      }
      setTimeout(onClose, 500); // Fecha após feedback
    } catch (error) {
      console.error("Erro ao executar rotina:", error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Aviso de Exclusão Mútua",
      "Isso irá apagar a rotina no aplicativo e permanentemente no Home Assistant. Esta ação é IRREVERSÍVEL.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Excluir", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/routines/${routine.entity_id}`);
              if (onDeleteSuccess) onDeleteSuccess(routine.entity_id);
              onClose();
            } catch (error) {
               Alert.alert("Erro", "Não foi possível excluir a rotina no Home Assistant.");
            }
          }
        }
      ]
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
                 name={getIconName(routine.attributes.icon || customIcon || (isAutomation ? 'robot' : 'script-text')) as any} 
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
                     onBlur={() => handleUpdate({ name: tempName })}
                     onSubmitEditing={() => handleUpdate({ name: tempName })}
                   />
                   <TouchableOpacity onPress={() => handleUpdate({ name: tempName })} style={styles.saveButton}>
                     <Text style={styles.saveIcon}>✓</Text>
                   </TouchableOpacity>
                 </View>
               ) : (
                 <TouchableOpacity onPress={() => { setEditingId('header'); setTempName(routine.attributes.friendly_name || routine.entity_id); }}>
                   <Text style={styles.title}>{routine.attributes.friendly_name || routine.entity_id} <Text style={styles.editIconHeader}>✎</Text></Text>
                 </TouchableOpacity>
               )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Execução */}
            <Text style={styles.sectionTitle}>Controles</Text>
            <View style={styles.executionBox}>
                {isAutomation && (
                    <View style={styles.toggleRow}>
                        <Text style={styles.toggleText}>Rotina Ativa</Text>
                        <Switch 
                            value={isOn} 
                            onValueChange={handleToggle}
                            trackColor={{ false: '#3D3D4D', true: '#4A6CF7' }}
                            thumbColor={isOn ? '#FFF' : '#A0A0A0'}
                        />
                    </View>
                )}
                <TouchableOpacity style={styles.executeButton} onPress={handleExecute}>
                    <MaterialCommunityIcons name="play-circle" size={24} color="#FFF" style={{marginRight: 8}} />
                    <Text style={styles.executeButtonText}>
                        {isAutomation ? "Forçar Execução Agora" : "Ativar Cena"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Descrição */}
            <Text style={styles.sectionTitle}>Descrição e Metadados</Text>
            <View style={styles.descriptionBox}>
                {editingId === 'description' ? (
                   <View>
                        <TextInput
                            style={styles.descriptionInput}
                            multiline
                            numberOfLines={4}
                            value={tempDescription}
                            onChangeText={setTempDescription}
                            autoFocus
                        />
                        <TouchableOpacity style={styles.saveDescButton} onPress={() => handleUpdate({ description: tempDescription })}>
                            <Text style={styles.saveIcon}>Salvar Descrição</Text>
                        </TouchableOpacity>
                   </View>
                ) : (
                    <TouchableOpacity onPress={() => setEditingId('description')}>
                        <Text style={styles.descriptionText}>
                            {routine.description || "Nenhuma descrição fornecida. Clique para editar."}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Ícones */}
            <Text style={styles.sectionTitle}>Personalizar Ícone</Text>
            <View style={styles.customIconContainer}>
              <MaterialCommunityIcons 
                name={getIconName(customIcon || routine.attributes.icon) as any} 
                size={24} 
                color="#4A6CF7" 
                style={{ marginRight: 10 }}
              />
              <TextInput
                style={styles.customIconInput}
                placeholder="Ex: robot, movie-open"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={customIcon}
                onChangeText={setCustomIcon}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.saveCustomIconButton} onPress={() => {
                  if (customIcon.trim()) {
                    handleUpdate({ icon: `mdi:${customIcon.trim()}` });
                    setCustomIcon("");
                  }
                }}>
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
                  style={[styles.iconPickerItem, getIconName(routine.attributes.icon) === item && styles.iconPickerItemActive]}
                  onPress={() => handleUpdate({ icon: `mdi:${item}` })}
                >
                  <MaterialCommunityIcons name={item as any} size={24} color={getIconName(routine.attributes.icon) === item ? '#FFF' : '#64648C'} />
                </TouchableOpacity>
              )}
              style={styles.iconList}
            />

            {/* Danger Zone */}
            <Text style={[styles.sectionTitle, { color: '#FF4444', marginTop: 30 }]}>Danger Zone</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <MaterialCommunityIcons name="delete-outline" size={20} color="#FFF" style={{marginRight: 8}}/>
                <Text style={styles.deleteButtonText}>Excluir Rotina Definitivamente</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  modalContent: { 
    backgroundColor: '#1E1E2C', borderTopLeftRadius: 30, borderTopRightRadius: 30, 
    height: '80%', padding: 24, elevation: 20
  },
  pullIndicator: { width: 40, height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 5, alignSelf: 'center', marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  titleWrapper: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  titleInput: { borderBottomWidth: 1, borderBottomColor: '#4A6CF7', paddingVertical: 0 },
  editWrapper: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  editIconHeader: { fontSize: 16, color: '#4A6CF7', marginLeft: 8 },
  closeButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  closeText: { fontWeight: '600', color: '#AAA' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#4A6CF7', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 15 },
  scrollContent: { paddingBottom: 40 },
  executionBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 24 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  toggleText: { color: '#FFF', fontSize: 18, fontWeight: '500' },
  executeButton: { backgroundColor: '#4A6CF7', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 12 },
  executeButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  descriptionBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 24, minHeight: 80 },
  descriptionText: { color: '#CCC', fontSize: 16, lineHeight: 24 },
  descriptionInput: { color: '#FFF', fontSize: 16, lineHeight: 24, textAlignVertical: 'top' },
  saveDescButton: { marginTop: 12, backgroundColor: '#4A6CF7', padding: 8, borderRadius: 8, alignSelf: 'flex-start' },
  customIconContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 },
  customIconInput: { flex: 1, color: '#FFF', fontSize: 16 },
  saveCustomIconButton: { backgroundColor: '#4A6CF7', padding: 8, borderRadius: 8, marginLeft: 8 },
  saveButton: { marginLeft: 10, backgroundColor: '#4A6CF7', padding: 8, borderRadius: 12 },
  saveIcon: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  iconList: { marginBottom: 20 },
  iconPickerItem: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  iconPickerItemActive: { backgroundColor: '#4A6CF7' },
  deleteButton: { backgroundColor: '#FF4444', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 12 },
  deleteButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
