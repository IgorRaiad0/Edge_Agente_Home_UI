import { useState, useCallback } from 'react';
import { api } from '../services/api';

export const useCameraActions = (entityId: string) => {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const takeSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      // O backend salvará no disco e retornará o path do arquivo estático (para live updates)
      await api.post(`/camera/${entityId}/snapshot`);
    } catch (e) {
      console.error("Erro ao tirar snapshot da câmera:", e);
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  const toggleRecording = useCallback(async () => {
    setLoading(true);
    try {
      const action = isRecording ? 'stop' : 'start';
      await api.post(`/camera/${entityId}/record`, { action });
      setIsRecording(!isRecording);
    } catch (e) {
      console.error("Erro ao controlar gravação de vídeo:", e);
    } finally {
      setLoading(false);
    }
  }, [entityId, isRecording]);

  return { takeSnapshot, toggleRecording, isRecording, loading };
};
