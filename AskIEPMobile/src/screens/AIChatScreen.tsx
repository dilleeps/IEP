import React, { useCallback, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { IconButton, SegmentedButtons } from '../components/ui';
import { API } from '../lib/api-config';
import { streamNDJSON } from '../lib/http-stream';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type ChatMode = 'advocacy' | 'legal';

const MessageBubble: React.FC<{message: Message}> = ({message}) => {
  const isUser = message.role === 'user';
  return (
    <View
      style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}
      accessibilityRole="text"
      accessibilityLabel={`${isUser ? 'You' : 'AI'}: ${message.content}`}>
      <Text style={[styles.bubbleText, isUser && styles.userText]}>
        {message.content}
      </Text>
    </View>
  );
};

const AIChatScreen: React.FC = () => {
  const [mode, setMode] = useState<ChatMode>('advocacy');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = {id: `user-${Date.now()}`, role: 'user', content: text};
    const assistantMsg: Message = {id: `assistant-${Date.now()}`, role: 'assistant', content: ''};

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    const url = mode === 'advocacy' ? API.advocacyChat : API.legalChat;

    try {
      const controller = await streamNDJSON(
        url,
        {
          onData: (chunk: any) => {
            const chunkText = chunk.content || chunk.text || chunk.delta;
            if (chunkText) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsg.id
                    ? {...m, content: m.content + chunkText}
                    : m,
                ),
              );
            }
          },
          onError: error => {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMsg.id ? {...m, content: error.message} : m,
              ),
            );
            setStreaming(false);
          },
          onComplete: () => {
            setStreaming(false);
          },
        },
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({message: text, history: messages}),
        },
      );
      abortRef.current = controller;
    } catch {
      setStreaming(false);
    }
  }, [input, streaming, mode, messages]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          AI Chat
        </Text>
        <SegmentedButtons
          value={mode}
          onValueChange={v => {
            setMode(v as ChatMode);
            setMessages([]);
          }}
          buttons={[
            {value: 'advocacy', label: 'Advocacy Lab', accessibilityLabel: 'Advocacy Lab mode'},
            {value: 'legal', label: 'Legal Support', accessibilityLabel: 'Legal Support mode'},
          ]}
          style={styles.modeSwitch}
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({item}) => <MessageBubble message={item} />}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({animated: true})
        }
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatTitle}>
              {mode === 'advocacy' ? '🏛️ Advocacy Lab' : '⚖️ Legal Support'}
            </Text>
            <Text style={styles.emptyChatText}>
              {mode === 'advocacy'
                ? 'Ask questions about IEP advocacy strategies, meeting preparation, and your rights.'
                : 'Get guidance on special education law, IDEA regulations, and dispute resolution.'}
            </Text>
            <Text style={styles.disclaimer}>
              AI responses are for informational purposes only and do not
              constitute legal advice.
            </Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Type your question..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={2000}
          editable={!streaming}
          accessibilityLabel="Message input"
          accessibilityHint="Type your question for the AI assistant"
        />
        {streaming ? (
          <IconButton
            icon="stop-circle"
            iconColor="#EF4444"
            onPress={stopStreaming}
            accessibilityLabel="Stop generating response"
          />
        ) : (
          <IconButton
            icon="send"
            iconColor="#5B5AF7"
            onPress={sendMessage}
            disabled={!input.trim()}
            accessibilityLabel="Send message"
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FEFFFE'},
  header: {padding: 16, paddingTop: 16},
  title: {fontSize: 28, fontWeight: '700', color: '#2D2D2D', marginBottom: 12},
  modeSwitch: {marginBottom: 4},
  messageList: {padding: 16, paddingBottom: 8, flexGrow: 1},
  bubble: {maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8},
  userBubble: {
    backgroundColor: '#5B5AF7', alignSelf: 'flex-end', borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  bubbleText: {fontSize: 15, lineHeight: 22, color: '#374151'},
  userText: {color: '#FFFFFF'},
  emptyChat: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, minHeight: 300},
  emptyChatTitle: {fontSize: 24, marginBottom: 8},
  emptyChatText: {fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 16},
  disclaimer: {fontSize: 12, color: '#9CA3AF', textAlign: 'center', fontStyle: 'italic'},
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12,
    borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 20, borderWidth: 1,
    borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#2D2D2D', backgroundColor: '#F9FAFB',
  },
});

export default AIChatScreen;
