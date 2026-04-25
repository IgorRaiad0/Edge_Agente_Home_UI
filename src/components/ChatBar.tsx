import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  Dimensions,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { sendVoiceCommand } from '../services/api';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = 72;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.45;

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

// Fast, non-bouncy animation config
const FAST_TIMING = {
  duration: 250,
  easing: Easing.out(Easing.quad),
};

/**
 * Animated dot for the typing indicator.
 */
function TypingDot({ delay }: { delay: number }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withDelay(delay, withTiming(1.4, { duration: 400 })),
        withTiming(1, { duration: 400 }),
      ),
      -1,
      true,
    );
  }, [delay, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: withTiming(scale.value === 1 ? 0.4 : 1, { duration: 400 }),
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export interface ChatBarProps {
  onSendMessage: (message: string) => Promise<string>;
}

/**
 * Intelligent Drawer-style Chat.
 * Optimized for speed and stable transitions (no "gelatina").
 */
export function ChatBar({ onSendMessage }: ChatBarProps) {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder();
  const [messages, setMessages] = useState<{ id: string; role: string; text: string }[]>([]);

  const inputRef = useRef<TextInput>(null);
  const expanded = useSharedValue(0);

  const handleFocus = useCallback(() => {
    expanded.value = withTiming(1, FAST_TIMING);
  }, [expanded]);

  // Handle manual dismissal
  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    expanded.value = withTiming(0, FAST_TIMING);
  }, [expanded]);

  const handleStopRecording = useCallback(async () => {
    const uri = await stopRecording();
    if (!uri) return;

    setIsSending(true);
    try {
      const response = await sendVoiceCommand(uri);
      setMessages((prev) => [{ id: Date.now().toString(), role: 'assistant', text: response }, ...prev]);
    } catch (error) {
      console.error("Erro ao processar voz:", error);
    } finally {
      setIsSending(false);
    }
  }, [stopRecording]);

  const handleSend = useCallback(async () => {
    const msg = text.trim();
    if (!msg || isSending) return;

    setIsSending(true);
    setMessages((prev) => [{ id: Date.now().toString(), role: 'user', text: msg }, ...prev]);
    setText('');

    try {
      const response = await onSendMessage(msg);
      setMessages((prev) => [{ id: (Date.now() + 1).toString(), role: 'assistant', text: response }, ...prev]);
    } catch {
      setMessages((prev) => [
        { id: (Date.now() + 2).toString(), role: 'assistant', text: 'Falha na comunicação com o Assistente.' },
        ...prev
      ]);
    } finally {
      setIsSending(false);
    }
  }, [text, isSending, onSendMessage]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    height: withTiming(expanded.value === 1 ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT, FAST_TIMING),
    width: withTiming(expanded.value === 1 ? '85%' : '65%', FAST_TIMING),
    maxWidth: 900,
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: withTiming(expanded.value, FAST_TIMING),
  }));

  const backdropBlurProps = useAnimatedProps(() => ({
    intensity: withTiming(expanded.value * 25, FAST_TIMING),
    pointerEvents: (expanded.value > 0.1 ? 'auto' : 'none') as any,
  }));

  const headerOpacityStyle = useAnimatedStyle(() => ({
    opacity: expanded.value > 0.3 ? withTiming(1, { duration: 150 }) : withTiming(0, { duration: 100 }),
    display: expanded.value === 0 ? 'none' : 'flex'
  }));

  const renderMessage = ({ item }: { item: any }) => {
    if (item.id === 'typing') {
      return (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={[styles.messagePill, styles.assistantPill, styles.typingPill]}
        >
          <TypingDot delay={0} />
          <TypingDot delay={150} />
          <TypingDot delay={300} />
        </Animated.View>
      );
    }

    return (
      <Animated.View
        entering={FadeIn.duration(400).easing(Easing.out(Easing.quad))}
        style={[
          styles.messagePill,
          item.role === 'user' ? styles.userPill : styles.assistantPill
        ]}
      >
        <Text style={styles.messageText}>{item.text}</Text>
      </Animated.View>
    );
  };

  // Combine messages with typing indicator if active
  const displayMessages = isSending
    ? [{ id: 'typing', role: 'assistant', text: '' }, ...messages]
    : messages;

  return (
    <>
      <AnimatedBlurView
        animatedProps={backdropBlurProps}
        tint="dark"
        style={[StyleSheet.absoluteFill, backdropStyle]}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={handleClose}
        />
      </AnimatedBlurView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.floatingAnchor}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.pillContainer, animatedPillStyle]}>
          <Pressable
            style={{ flex: 1, outlineStyle: 'none' } as any}
            onPress={() => inputRef.current?.focus()}
          >
            <AnimatedBlurView
              intensity={30}
              tint="light"
              style={styles.pillInner}
            >
              <Animated.View style={[styles.drawerHeader, headerOpacityStyle]}>
                <Text style={styles.headerTitle}>EdgeHome Assistant</Text>
                <Pressable onPress={handleClose} style={styles.closeBtn}>
                  <Text style={styles.closeIcon}>✕</Text>
                </Pressable>
              </Animated.View>

              <View style={styles.historyContainer}>
                <Animated.View style={[{ flex: 1 }, headerOpacityStyle]}>
                  <FlatList
                    data={displayMessages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    inverted={true}
                    contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 15 }}
                    showsVerticalScrollIndicator={false}
                  />
                </Animated.View>
              </View>

              <View style={styles.inputArea}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Ask Assistant..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={text}
                  onChangeText={setText}
                  onFocus={handleFocus}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                  editable={!isSending}
                />
                {text.trim() || isSending ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.sendBtn,
                      pressed && styles.pressed,
                    ]}
                    onPress={handleSend}
                    disabled={isSending}
                  >
                    <Text style={styles.sendIcon}>▶</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.micBtn,
                      isRecording ? styles.recordingActive : null,
                      pressed && styles.pressed,
                    ]}
                    onPressIn={startRecording}
                    onPressOut={handleStopRecording}
                    disabled={isSending}
                  >
                    <Text style={styles.micIcon}>{isRecording ? '●' : '🎙'}</Text>
                  </Pressable>
                )}
              </View>
            </AnimatedBlurView>
          </Pressable>
        </Animated.View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  floatingAnchor: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  pillContainer: {
    overflow: 'hidden',
    borderRadius: 36,
    // @ts-ignore
    outlineStyle: 'none',
  } as any,
  pillInner: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'flex-end',
    // @ts-ignore
    outlineStyle: 'none',
  } as any,
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    color: '#FFF',
    fontSize: 12,
  },
  historyContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    paddingVertical: 0,
    // @ts-ignore - Specific for React Native Web
    outlineStyle: 'none',
    // @ts-ignore
    outlineWidth: 0,
  } as any,
  sendBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
  },
  pressed: {
    opacity: 0.6,
  },
  micBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
  },
  recordingActive: {
    backgroundColor: '#FF3B30',
  },
  micIcon: {
    fontSize: 18,
    color: '#FFF',
  },
  sendIcon: {
    fontSize: 18,
    color: '#FFF',
  },
  messagePill: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 22,
    marginBottom: 10,
    // Subtle shadow for premium feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  userPill: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  assistantPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74, 108, 247, 0.25)',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(74, 108, 247, 0.3)',
  },
  messageText: {
    color: '#FFF',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  typingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 38,
    padding: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginHorizontal: 3,
  },
});






