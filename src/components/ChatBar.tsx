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
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
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
        { id: (Date.now() + 2).toString(), role: 'assistant', text: 'Error in communication.' },
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
  }));

  const renderMessage = ({ item }: { item: any }) => (
    <Animated.View 
      entering={FadeIn.duration(200)}
      style={[
        styles.messagePill,
        item.role === 'user' ? styles.userPill : styles.assistantPill
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </Animated.View>
  );

  return (
    <>
      <AnimatedBlurView
        animatedProps={backdropBlurProps}
        tint="dark"
        style={[StyleSheet.absoluteFill, backdropStyle]}
        pointerEvents={expanded.value > 0.1 ? 'auto' : 'none'}
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
            style={{ flex: 1 }} 
            onPress={() => inputRef.current?.focus()}
          >
            <AnimatedBlurView
              intensity={30}
              tint="light"
              style={styles.pillInner}
            >
              {expanded.value > 0.3 && (
                <View style={styles.drawerHeader}>
                  <Text style={styles.headerTitle}>EdgeHome Assistant</Text>
                  <Pressable onPress={handleClose} style={styles.closeBtn}>
                    <Text style={styles.closeIcon}>✕</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.historyContainer}>
                {expanded.value > 0.1 && (
                  <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    inverted={true}
                    contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 15 }}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>

              <View style={styles.inputArea}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Type Here..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={text}
                  onChangeText={setText}
                  onFocus={handleFocus}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                  editable={!isSending}
                />
                <Pressable
                  style={({ pressed }) => [
                    styles.sendBtn,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleSend}
                  disabled={isSending || !text.trim()}
                >
                  <Text style={styles.sendIcon}>▶</Text>
                </Pressable>
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
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pillContainer: {
    overflow: 'hidden',
    borderRadius: 36,
  },
  pillInner: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'flex-end',
  },
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
  },
  sendBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  pressed: {
    opacity: 0.6,
  },
  sendIcon: {
    fontSize: 22,
    color: '#FFF',
  },
  messagePill: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  userPill: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomRightRadius: 4,
  },
  assistantPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(74, 108, 247, 0.2)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 18,
  },
});






