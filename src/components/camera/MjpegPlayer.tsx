import React from 'react';
import { Platform, Image, StyleSheet } from 'react-native';

interface Props {
  streamUrl: string;   // URL do proxy MJPEG (backend)
  frameUrl: string;    // URL do frame estático (para polling no mobile)
  cacheBust: number;
}

// Na web: renderiza <img> HTML nativo que suporta MJPEG multipart
// No mobile: renderiza Image do RN com polling de frames
export function MjpegPlayer({ streamUrl, frameUrl, cacheBust }: Props) {
  if (Platform.OS === 'web') {
    return (
      <img
        src={streamUrl}
        style={webStyles}
        alt="Camera stream"
      />
    );
  }

  return (
    <Image
      source={{ uri: `${frameUrl}&_t=${cacheBust}`, cache: 'reload' }}
      style={styles.image}
      resizeMode="contain"
    />
  );
}

// Estilo inline para a tag <img> HTML (só usado na web)
const webStyles: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  backgroundColor: '#000',
  display: 'block',
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
});
