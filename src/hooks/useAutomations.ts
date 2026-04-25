import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  fetchAutomations, 
  fetchGroupedDevices, 
  fetchDevices, 
  fetchScenes 
} from '../services/api';
import { HAEntity, DeviceGroup, EntityCategory } from '../types';

export interface UseAutomationsReturn {
  entities: (HAEntity | DeviceGroup)[];
  isLoading: boolean;
  search: string;
  setSearch: (s: string) => void;
  filteredEntities: (HAEntity | DeviceGroup)[];
  refresh: () => void;
}

interface WSMessage {
  event: string;
  entity_id: string;
  new_state: string;
}

/**
 * Custom hook that manages HA entity data (Automations, Scenes, Devices) 
 * with dynamic loading and REAL-TIME synchronization via WebSocket.
 */
export function useAutomations(category: EntityCategory): UseAutomationsReturn {
  const [entities, setEntities] = useState<(HAEntity | DeviceGroup)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const ws = useRef<WebSocket | null>(null);

  // 1. Carregamento Inicial (Snapshot)
  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      let data: (HAEntity | DeviceGroup)[] = [];
      switch (category) {
        case 'Automations': data = await fetchAutomations(); break;
        case 'Scenes': data = await fetchScenes(); break;
        case 'Devices': data = await fetchGroupedDevices(); break;
        case 'Integrations': data = await fetchDevices(); break;
        default: data = [];
      }
      setEntities(data);
    } catch (error) {
      console.error(`Erro ao carregar ${category}:`, error);
      setEntities([]);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  // 2. Sincronização em Tempo Real (WebSocket)
  useEffect(() => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
    const wsUrl = apiUrl.replace('http', 'ws').replace('/api', '').replace(/\/$/, '') + '/ws';
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onmessage = (event) => {
      try {
        const data: any = JSON.parse(event.data);
        if (data.event === 'state_changed') {
          // Passamos novo nome e novo ícone (se houverem)
          setEntities((prev) => updateEntitiesState(prev, data.entity_id, data.new_state, data.new_name, data.new_icon));
        }
      } catch (e) {
        console.error("Erro WS:", e);
      }
    };

    return () => ws.current?.close();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredEntities = useMemo(() => {
    if (!search.trim()) return entities;
    const q = search.toLowerCase();
    
    return entities.filter((item) => {
      const name = ('name' in item) 
        ? item.name.toLowerCase() 
        : (item.attributes.friendly_name || item.entity_id).toLowerCase();
      return name.includes(q);
    });
  }, [entities, search]);

  return {
    entities,
    isLoading,
    search,
    setSearch,
    filteredEntities,
    refresh: load,
  };
}

/**
 * Função utilitária para atualizar o estado de forma polimórfica (Entidade ou Grupo).
 * Agora suporta atualização de NOME e ÍCONE além do ESTADO.
 */
function updateEntitiesState(
  current: (HAEntity | DeviceGroup)[], 
  entityId: string, 
  newState: string,
  newName?: string,
  newIcon?: string
): (HAEntity | DeviceGroup)[] {
  return current.map((item) => {
    // Caso 1: É um Grupo de Dispositivos
    if ('main_entity' in item) {
      const group = item as DeviceGroup;
      let changed = false;
      
      // Atualiza a entidade principal se necessário (Estado, Nome e Ícone)
      let updatedMain = group.main_entity;
      if (group.main_entity?.entity_id === entityId) {
        updatedMain = { 
          ...group.main_entity, 
          state: newState,
          name: newName || group.main_entity.name
        };
        changed = true;
      }

      // Atualiza o ícone do grupo se for a entidade líder ou se o ícone do grupo mudar
      let updatedGroupIcon = group.icon;
      if (group.main_entity?.entity_id === entityId && newIcon) {
        updatedGroupIcon = newIcon;
        changed = true;
      }

      // Atualiza as sub-entidades
      const updatedEntities = group.entities.map(sub => {
        if (sub.entity_id === entityId) {
          changed = true;
          return { 
            ...sub, 
            state: newState,
            name: newName || sub.name
          };
        }
        return sub;
      });

      // Se mudar o nome da entidade líder, o nome do grupo também muda
      let updatedGroupName = group.name;
      if (group.main_entity?.entity_id === entityId && newName) {
        updatedGroupName = newName;
      }

      return changed ? { 
        ...group, 
        name: updatedGroupName,
        icon: updatedGroupIcon,
        main_entity: updatedMain, 
        entities: updatedEntities 
      } : group;
    } 
    
    // Caso 2: É uma Entidade Simples (Automação, Cena, etc)
    const entity = item as HAEntity;
    if (entity.entity_id === entityId) {
      return { 
        ...entity, 
        state: newState,
        attributes: {
          ...entity.attributes,
          friendly_name: newName || entity.attributes.friendly_name,
          icon: newIcon || entity.attributes.icon
        }
      };
    }
    
    return item;
  });
}
