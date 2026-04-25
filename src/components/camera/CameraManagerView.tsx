import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, Modal, Switch, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCameraActions } from '../../hooks/useCameraActions';
import { MediaGallery } from './MediaGallery';
import { MjpegPlayer } from './MjpegPlayer';
import { api } from '../../services/api';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.29:8000/api';

interface SubEntity {
  entity_id: string;
  domain: string;
  state: string;
  name: string;
}

interface Props {
  entityId: string;
  entities?: SubEntity[];
}

export function CameraManagerView({ entityId, entities = [] }: Props) {
  const [activeTab, setActiveTab] = useState<'live' | 'gallery'>('live');
  const [streamData, setStreamData] = useState<{ frame_url: string } | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [cacheBust, setCacheBust] = useState(Date.now());
  const [fullScreen, setFullScreen] = useState(false);
  const [entityStates, setEntityStates] = useState<Record<string, string>>(
    Object.fromEntries(entities.map(e => [e.entity_id, e.state]))
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { takeSnapshot, toggleRecording, isRecording, loading } = useCameraActions(entityId);

  const proxyUrl = `${BASE_URL}/camera/${entityId}/proxy_stream`;

  // Entidades relevantes para mostrar nos controles
  const switchEntities = entities.filter(e =>
    e.domain === 'switch' && !e.entity_id.includes('trigger_alarm') &&
    !e.entity_id.includes('automatically_upgrade') && !e.entity_id.includes('diagnose') &&
    !e.entity_id.includes('media_sync') && e.state !== 'unavailable'
  );
  const sensorEntities = entities.filter(e =>
    (e.domain === 'binary_sensor' || e.domain === 'sensor') &&
    !e.entity_id.includes('signal_level') && e.state !== 'unavailable'
  );
  const lightEntities = entities.filter(e => e.domain === 'light' && e.state !== 'unavailable');

  const handleToggle = async (entity_id: string, currentState: string) => {
    const newState = currentState === 'on' ? 'off' : 'on';
    setEntityStates(prev => ({ ...prev, [entity_id]: newState }));
    try {
      await api.post('/devices/execute', {
        entity_id,
        service: newState === 'on' ? 'turn_on' : 'turn_off'
      });
    } catch {
      setEntityStates(prev => ({ ...prev, [entity_id]: currentState }));
    }
  };

  useEffect(() => {
    if (activeTab !== 'live') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setStreamLoading(true);
    api.get(`/camera/${entityId}/stream`)
      .then(res => {
        setStreamData(res.data);
        if (Platform.OS !== 'web') {
          intervalRef.current = setInterval(() => setCacheBust(Date.now()), 600);
        }
      })
      .catch(() => setStreamData(null))
      .finally(() => setStreamLoading(false));

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [entityId, activeTab]);

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'live' && styles.activeTab]}
          onPress={() => setActiveTab('live')}
        >
          <MaterialCommunityIcons name="cctv" size={20} color={activeTab === 'live' ? '#FFF' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'live' && styles.activeTabText]}>Ao Vivo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'gallery' && styles.activeTab]}
          onPress={() => setActiveTab('gallery')}
        >
          <MaterialCommunityIcons name="view-gallery" size={20} color={activeTab === 'gallery' ? '#FFF' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'gallery' && styles.activeTabText]}>Arquivo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        {activeTab === 'live' ? (
          <View style={styles.liveContainer}>
            {/* Player com botão de tela cheia */}
            {streamLoading ? (
              <View style={styles.streamPlaceholder}>
                <ActivityIndicator size="large" color="#4A6CF7" />
                <Text style={styles.streamText}>Conectando ao stream...</Text>
              </View>
            ) : streamData ? (
              <TouchableOpacity activeOpacity={0.95} onPress={() => setFullScreen(true)} style={styles.videoWrapper}>
                <MjpegPlayer streamUrl={proxyUrl} frameUrl={streamData.frame_url} cacheBust={cacheBust} />
                {isRecording && (
                  <View style={styles.recordingIndicator}>
                    <View style={styles.redDot} />
                    <Text style={styles.redText}>REC</Text>
                  </View>
                )}
                <View style={styles.fullscreenBadge}>
                  <MaterialCommunityIcons name="fullscreen" size={14} color="#FFF" />
                  <Text style={styles.fullscreenText}>Tela cheia</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.streamPlaceholder}>
                <MaterialCommunityIcons name="video-off" size={48} color="rgba(255,255,255,0.2)" />
                <Text style={styles.streamText}>Stream indisponível</Text>
              </View>
            )}

            {/* Botões Foto / Gravar */}
            <View style={styles.controlsRow}>
              <TouchableOpacity style={[styles.actionBtn, loading && styles.actionBtnDisabled]} onPress={takeSnapshot} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <MaterialCommunityIcons name="camera" size={28} color="#FFF" />}
                <Text style={styles.actionText}>Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, isRecording && styles.actionBtnDanger]} onPress={toggleRecording} disabled={loading}>
                <MaterialCommunityIcons name={isRecording ? 'stop' : 'record-rec'} size={28} color="#FFF" />
                <Text style={styles.actionText}>{isRecording ? 'Parar' : 'Gravar'}</Text>
              </TouchableOpacity>
            </View>

            {/* Painel de Controles das Entidades */}
            {(switchEntities.length > 0 || lightEntities.length > 0 || sensorEntities.length > 0) && (
              <View style={styles.entitiesPanel}>
                <Text style={styles.panelTitle}>Controles</Text>

                {[...lightEntities, ...switchEntities].map(e => {
                  const state = entityStates[e.entity_id] ?? e.state;
                  return (
                    <View key={e.entity_id} style={styles.entityRow}>
                      <Text style={styles.entityLabel} numberOfLines={1}>{e.name}</Text>
                      <Switch
                        value={state === 'on'}
                        onValueChange={() => handleToggle(e.entity_id, state)}
                        trackColor={{ false: '#3D3D4D', true: '#4A6CF7' }}
                        thumbColor={state === 'on' ? '#FFF' : '#A0A0A0'}
                      />
                    </View>
                  );
                })}

                {sensorEntities.length > 0 && (
                  <>
                    <Text style={[styles.panelTitle, { marginTop: 12 }]}>Sensores</Text>
                    {sensorEntities.map(e => (
                      <View key={e.entity_id} style={styles.entityRow}>
                        <Text style={styles.entityLabel} numberOfLines={1}>{e.name}</Text>
                        <Text style={styles.sensorValue}>{e.state}</Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>
        ) : (
          <MediaGallery entityId={entityId} />
        )}
      </View>

      {/* Modal Tela Cheia */}
      <Modal visible={fullScreen} animationType="fade" transparent={false} onRequestClose={() => setFullScreen(false)}>
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity style={styles.fullscreenClose} onPress={() => setFullScreen(false)}>
            <MaterialCommunityIcons name="fullscreen-exit" size={28} color="#FFF" />
          </TouchableOpacity>
          {streamData && (
            <MjpegPlayer streamUrl={proxyUrl} frameUrl={streamData.frame_url} cacheBust={cacheBust} />
          )}
          {isRecording && (
            <View style={[styles.recordingIndicator, { top: 60, right: 20 }]}>
              <View style={styles.redDot} />
              <Text style={styles.redText}>REC</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#4A6CF7',
  },
  tabText: {
    color: '#888',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  activeTabText: {
    color: '#FFF',
  },
  contentArea: {
    minHeight: 300,
  },
  liveContainer: {
    minHeight: 300,
  },
  videoWrapper: {
    height: 220,
    backgroundColor: '#000',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  fullscreenBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  fullscreenText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  fullscreenClose: {
    position: 'absolute',
    top: 44,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 10,
    borderRadius: 8,
  },
  entitiesPanel: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A6CF7',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  entityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  entityLabel: {
    color: '#CCC',
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  sensorValue: {
    color: '#4A6CF7',
    fontSize: 14,
    fontWeight: '600',
  },
  streamPlaceholder: {
    height: 220,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden'
  },
  streamText: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 10,
    fontWeight: '500'
  },
  recordingIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    marginRight: 6
  },
  redText: {
    color: '#FF4444',
    fontWeight: 'bold',
    fontSize: 12
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  actionBtnDisabled: {
    opacity: 0.5
  },
  actionBtnDanger: {
    backgroundColor: '#FF4444'
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600'
  }
});
