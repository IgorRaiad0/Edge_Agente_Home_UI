import { useState } from 'react';
import { Audio } from 'expo-av';
import { Alert } from 'react-native';

/**
 * Hook customizado para gerenciar a lógica de gravação de áudio com Expo AV.
 * Isola as permissões e o controle de estado da interface visual.
 */
export const useVoiceRecorder = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      // 1. Gerencia Permissões
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos da permissão do microfone para ouvir você.');
        return;
      }

      // 2. Configura modo de áudio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // 3. Inicia Gravação
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Falha ao iniciar gravação:', err);
      setIsRecording(false);
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!recording) return null;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      const uri = recording.getURI();
      setRecording(null);
      
      return uri; // Retorna o caminho do arquivo para o componente chamar a API
    } catch (err) {
      console.error('Falha ao parar gravação:', err);
      setRecording(null);
      return null;
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
};
