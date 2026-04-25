/**
 * Tipagens globais para o sistema HomeAgente / EdgeHomeUI.
 */

export interface HAEntity {
  entity_id: string;
  state: string;
  description?: string;
  attributes: {
    friendly_name?: string;
    icon?: string;
    [key: string]: any;
  };
}

export interface SubEntity {
  entity_id: string;
  domain: string;
  name: string;
  state: string;
  attributes?: any;
}

export interface DeviceGroup {
  id: string;
  name: string;
  icon: string;
  main_entity: SubEntity | null;
  entities: SubEntity[];
}

export type EntityCategory = 'Automations' | 'Scenes' | 'Devices' | 'Integrations';
