import React, { useState, useEffect } from 'react';
import { View, FlatList, Image, TouchableOpacity, Text, StyleSheet, Dimensions, Modal } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../services/api';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = (width - 60) / COLUMN_COUNT; // Ajuste pra margens

interface MediaItem {
  title: string;
  url: string;
  type: 'image' | 'video';
}

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.29:8000/api').replace(/\/api\/?$/, '');

export function MediaGallery({ entityId }: { entityId: string }) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const fetchMedia = async () => {
    try {
      const res = await api.get(`/camera/${entityId}/gallery`);
      setMedia(res.data.media || []);
    } catch (e) {
      console.error("Erro ao carregar galeria:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
    const interval = setInterval(fetchMedia, 15000); // Polling a cada 15s pra atualizar novos uploads
    return () => clearInterval(interval);
  }, [entityId]);

const renderItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity 
      style={styles.thumbnailContainer} 
      onPress={() => setSelectedMedia(item)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: `${BASE_URL}${item.url}` }} 
        style={styles.thumbnail} 
        resizeMode="cover"
      />
      {item.type === 'video' && (
        <View style={styles.videoOverlay}>
          <MaterialCommunityIcons name="play-circle" size={24} color="#FFF" />
        </View>
      )}
      <View style={styles.dateLabel}>
        <Text style={styles.dateText}>{item.title.replace(/\.[^.]+$/, '').split('_').slice(-2).join(' ')}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {media.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="camera-off" size={48} color="#666" />
            <Text style={styles.emptyText}>Nenhuma mídia salva nesta câmera.</Text>
        </View>
      ) : (
        <FlatList
          data={media}
          numColumns={COLUMN_COUNT}
          keyExtractor={(item) => item.title}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Full Screen Viewer Simples */}
      <Modal visible={!!selectedMedia} transparent animationType="fade" onRequestClose={() => setSelectedMedia(null)}>
        <View style={styles.modalBg}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedMedia(null)}>
                <MaterialCommunityIcons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
            {selectedMedia && selectedMedia.type === 'video' ? (
                <Video
                    source={{ uri: `${BASE_URL}${selectedMedia.url}` }}
                    style={styles.fullScreenImage}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls
                    shouldPlay
                />
            ) : selectedMedia ? (
                <Image 
                    source={{ uri: `${BASE_URL}${selectedMedia.url}` }} 
                    style={styles.fullScreenImage} 
                    resizeMode="contain"
                />
            ) : null}
            <Text style={styles.modalDate}>
                {selectedMedia?.title}
            </Text>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    marginTop: 10,
    minHeight: 300
  },
  listContent: {
    padding: 10,
  },
  thumbnailContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2A2A3C',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  dateText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    color: '#999',
    marginTop: 12,
    textAlign: 'center'
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10
  },
  fullScreenImage: {
    width: '100%',
    height: '70%',
  },
  modalDate: {
    color: '#FFF',
    fontSize: 14,
    position: 'absolute',
    bottom: 50
  }
});
