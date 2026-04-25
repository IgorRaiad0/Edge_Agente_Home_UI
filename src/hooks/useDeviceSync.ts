// src/hooks/useDeviceSync.ts
import { useEffect, useRef } from 'react';
import { DeviceGroup } from '../types';

interface WSMessage {
  event: string;
  entity_id: string;
  new_state: string;
}

/**
 * Hook que conecta ao WebSocket do backend para manter o estado
 * dos dispositivos sincronizado em tempo real.
 */
export const useDeviceSync = (
  devices: DeviceGroup[], 
  setDevices: React.Dispatch<React.SetStateAction<DeviceGroup[]>>
) => {
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Tenta derivar a URL do WebSocket a partir da URL da API
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
    
    // Converte http://.../api -> ws://.../ws
    // Se o usuário estiver usando um IP real, isso garante que o WS aponte pro lugar certo
    const wsUrl = apiUrl
      .replace('http', 'ws')
      .replace('/api', '')
      .replace(/\/$/, '') + '/ws';
    
    console.log(`--- [LOG WS] Conectando em ${wsUrl}... ---`);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('🟢 [LOG WS] Conectado e ouvindo mudanças físicas!');
    };

    ws.current.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        if (data.event === 'state_changed') {
          setDevices((prevDevices) => updateDeviceState(prevDevices, data.entity_id, data.new_state));
        }
      } catch (error) {
        console.error('--- [LOG WS] Erro ao processar mensagem:', error);
      }
    };

    ws.current.onclose = () => {
      console.log('🔴 [LOG WS] Desconectado.');
    };

    return () => {
      ws.current?.close();
    };
  }, []); // Sem dependências para não criar múltiplas conexões
};

/**
 * Atualização "cirúrgica" do estado.
 * Itera sobre os grupos e sub-entidades e atualiza apenas o que mudou.
 */
const updateDeviceState = (
  currentDevices: DeviceGroup[], 
  changedEntityId: string, 
  newState: string
): DeviceGroup[] => {
  return currentDevices.map((device) => {
    let hasChanges = false;

    // 1. Verifica se a entidade principal do grupo mudou
    let updatedMain = device.main_entity;
    if (device.main_entity?.entity_id === changedEntityId) {
      updatedMain = { ...device.main_entity, state: newState };
      hasChanges = true;
    }

    // 2. Verifica se alguma sub-entidade (sensores, interruptores secundários) mudou
    const updatedEntities = device.entities.map((sub) => {
      if (sub.entity_id === changedEntityId) {
        hasChanges = true;
        return { ...sub, state: newState };
      }
      return sub;
    });

    if (!hasChanges) return device;

    return {
      ...device,
      main_entity: updatedMain,
      entities: updatedEntities,
    };
  });
};
