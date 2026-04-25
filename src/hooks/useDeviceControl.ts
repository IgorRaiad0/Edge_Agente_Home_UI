// src/hooks/useDeviceControl.ts
import { useState } from 'react';
import { api } from '../services/api';

/**
 * Hook universal para controle de dispositivos (on/off/toggle).
 * Gerencia estado local para feedback instantâneo e lida com o loading.
 */
export const useDeviceControl = (entityId: string, initialState: string) => {
  const [state, setState] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const toggleDevice = async () => {
    setLoading(true);
    try {
      // Decide a ação baseada no estado atual
      const action = state === 'on' ? 'turn_off' : 'turn_on';
      
      console.log(`--- [LOG] Enviando comando ${action} para ${entityId} ---`);

      const response = await api.post('/devices/execute', {
        entity_id: entityId,
        service: action
      });

      if (response.data.status === 'success') {
        setState(response.data.new_state);
      }
    } catch (error) {
      console.error("Erro ao controlar dispositivo:", error);
      // Opcional: Reverter estado ou mostrar alerta
    } finally {
      setLoading(false);
    }
  };

  return { state, loading, toggleDevice };
};
