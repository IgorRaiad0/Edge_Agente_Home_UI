import axios from 'axios';
import { Platform } from 'react-native';

// Puxa a URL base do seu arquivo .env
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BASE_URL) {
  console.error("ERRO: EXPO_PUBLIC_API_URL não está definida no .env!");
}

// Cria uma instância configurada do Axios
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // Dá 15 segundos para o Assistente responder antes de dar erro
  headers: {
    'Content-Type': 'application/json',
  },
});

import { DeviceGroup, HAEntity } from '../types';

export interface ChatResponse {
  resposta: string;
}

// ---------------------------------------------------------
// FUNÇÕES DE SERVIÇO
// ---------------------------------------------------------

/**
 * Envia uma mensagem de texto para o Assistente e retorna a resposta.
 */
export const sendMessageToAssistant = async (texto: string): Promise<string> => {
  try {
    const response = await api.post<ChatResponse>('/chat', { texto });
    return response.data.resposta;
  } catch (error) {
    console.error("Erro ao comunicar com o Assistente:", error);
    throw new Error("Falha na comunicação com os sistemas centrais.");
  }
};

/**
 * Envia um áudio para o Assistente e retorna a resposta transcrita e processada.
 * Compatível com Web (Blob) e Mobile (Native URI).
 */
export const sendVoiceCommand = async (audioUri: string): Promise<string> => {
  const formData = new FormData();
  
  if (Platform.OS === 'web') {
    // --- LÓGICA EXCLUSIVA PARA O NAVEGADOR (WEB) ---
    try {
      // 1. O navegador usa URLs "blob:", buscamos os bytes crus na memória
      const response = await fetch(audioUri);
      const blob = await response.blob();
      
      // 2. Na Web, anexamos o Blob diretamente
      // O Whisper da Groq aceita .webm (padrão web) ou .m4a
      formData.append('file', blob, 'comando_voz.webm'); 
    } catch (e) {
      console.error("Erro ao converter blob de áudio na Web:", e);
      return "Erro no processamento interno do áudio.";
    }
  } else {
    // --- LÓGICA EXCLUSIVA PARA CELULAR (ANDROID / IOS) ---
    const uriCorrigida = audioUri.startsWith('file://') || audioUri.startsWith('content://') 
      ? audioUri 
      : `file://${audioUri}`;
    
    formData.append('file', {
      uri: uriCorrigida,
      name: 'comando_voz.m4a',
      type: 'audio/m4a',
    } as any);
  }

  try {
    const baseURL = BASE_URL || 'http://localhost:8000/api';
    const finalUrl = baseURL.endsWith('/') ? `${baseURL}voice` : `${baseURL}/voice`;

    const response = await fetch(finalUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erro do servidor (${response.status}):`, errorText);
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.resposta;
  } catch (error) {
    console.error("Erro ao enviar áudio para o servidor:", error);
    return "Desculpe, não consegui enviar o áudio para o servidor.";
  }
};

// ---------------------------------------------------------
// COMPATIBILIDADE / PLACEHOLDERS
// ---------------------------------------------------------

/**
 * Alias para manter compatibilidade com o LayoutWrapper durante a transição.
 */
export const sendMessage = sendMessageToAssistant;


/**
 * Busca dados combinados de rotinas (Automações e Cenas).
 */
const fetchRoutines = async () => {
  try {
    const response = await api.get('/routines');
    return response.data.data;
  } catch (error) {
    console.error("Erro ao buscar rotinas:", error);
    return { automations: [], scenes: [] };
  }
}

/**
 * Busca as automações cadastradas no Home Assistant (agora com meta_description).
 */
export const fetchAutomations = async (): Promise<HAEntity[]> => {
  const data = await fetchRoutines();
  return data.automations || [];
};

/**
 * Busca dispositivos agrupados pelo novo algoritmo do backend.
 */
export const fetchGroupedDevices = async (): Promise<DeviceGroup[]> => {
  try {
    const response = await api.get<DeviceGroup[]>('/devices/grouped');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar dispositivos agrupados:", error);
    return [];
  }
};

/**
 * Busca dispositivos de controle (luzes, interruptores, etc).
 */
export const fetchDevices = async (): Promise<HAEntity[]> => {
  try {
    const response = await api.get<{ data: HAEntity[] }>('/devices');
    return response.data.data;
  } catch (error) {
    console.error("Erro ao buscar dispositivos:", error);
    return [];
  }
};

/**
 * Busca cenas e scripts do sistema (agora com meta_description).
 */
export const fetchScenes = async (): Promise<HAEntity[]> => {
  const data = await fetchRoutines();
  return data.scenes || [];
};
