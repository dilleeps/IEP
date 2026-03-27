import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { Button, Card, Chip, TextInput } from '../components/ui';
import { useChildren } from '../hooks/useChildren';
import {
  useCreateLetter,
  useDeleteLetter,
  useGenerateLetterDraft,
  useLetters,
  useUpdateLetter,
} from '../hooks/useLetters';
import type { LetterStatus, LetterType } from '../types/domain';

const LETTER_TYPES: {value: LetterType; label: string}[] = [
  {value: 'request', label: 'Request'},
  {value: 'concern', label: 'Concern'},
  {value: 'thank_you', label: 'Thank You'},
  {value: 'follow_up', label: 'Follow Up'},
  {value: 'complaint', label: 'Complaint'},
  {value: 'appeal', label: 'Appeal'},
];

const STATUS_COLORS: Record<LetterStatus, string> = {
  draft: '#F59E0B',
  final: '#5B5AF7',
  sent: '#10B981',
};

type ScreenMode = 'list' | 'compose' | 'view';

const LetterWriterScreen: React.FC = () => {
  const [mode, setMode] = useState<ScreenMode>('list');
  const [selectedType, setSelectedType] = useState<LetterType>('request');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recipient, setRecipient] = useState('');
  const [context, setContext] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const {data: childrenData} = useChildren();
  const firstChildId = childrenData?.children?.[0]?.id || '';
  const {data, isLoading, error, refetch} = useLetters(firstChildId);
  const createLetter = useCreateLetter();
  const updateLetter = useUpdateLetter();
  const deleteLetter = useDeleteLetter();
  const generateDraft = useGenerateLetterDraft();

  const resetForm = () => {
    setTitle('');
    setContent('');
    setRecipient('');
    setContext('');
    setEditingId(null);
    setSelectedType('request');
  };

  const handleGenerate = useCallback(async () => {
    if (!firstChildId || !context.trim()) return;
    try {
      const result = await generateDraft.mutateAsync({
        childId: firstChildId,
        letterType: selectedType,
        context: context.trim(),
      });
      setContent(result.content);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, [firstChildId, selectedType, context, generateDraft]);

  const handleSave = useCallback(async () => {
    if (!title.trim() || !content.trim() || !firstChildId) return;
    try {
      if (editingId) {
        await updateLetter.mutateAsync({
          id: editingId,
          data: {title: title.trim(), content: content.trim(), recipientName: recipient.trim()},
        });
      } else {
        await createLetter.mutateAsync({
          childId: firstChildId,
          letterType: selectedType,
          title: title.trim(),
          content: content.trim(),
          recipientName: recipient.trim(),
        });
      }
      resetForm();
      setMode('list');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }, [title, content, recipient, firstChildId, selectedType, editingId, createLetter, updateLetter]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete Letter', 'Are you sure you want to delete this letter?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteLetter.mutate(id),
      },
    ]);
  }, [deleteLetter]);

  if (mode === 'compose') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.formContent}>
          <Text style={styles.title} accessibilityRole="header">
            {editingId ? 'Edit Letter' : 'Compose Letter'}
          </Text>

          <Text style={styles.label}>Letter Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
            {LETTER_TYPES.map(type => (
              <Chip
                key={type.value}
                selected={selectedType === type.value}
                onPress={() => setSelectedType(type.value)}
                style={styles.typeChip}>
                {type.label}
              </Chip>
            ))}
          </ScrollView>

          <TextInput
            label="Recipient Name"
            value={recipient}
            onChangeText={setRecipient}
            style={styles.input}
            accessibilityLabel="Recipient name"
          />
          <TextInput
            label="Letter Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            accessibilityLabel="Letter title"
          />

          {!editingId && (
            <>
              <TextInput
                label="Describe what you need (AI will draft)"
                value={context}
                onChangeText={setContext}
                multiline
                numberOfLines={3}
                style={styles.input}
                accessibilityLabel="Context for AI generation"
              />
              <Button
                mode="outlined"
                onPress={handleGenerate}
                disabled={!context.trim() || generateDraft.isPending}
                style={styles.generateBtn}
                labelStyle={{color: '#5B5AF7'}}
                accessibilityLabel="Generate letter draft with AI">
                {generateDraft.isPending ? 'Generating...' : 'Generate with AI'}
              </Button>
            </>
          )}

          <TextInput
            label="Letter Content"
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            style={[styles.input, styles.contentInput]}
            accessibilityLabel="Letter content"
          />

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => {resetForm(); setMode('list');}}
              style={styles.cancelBtn}
              accessibilityLabel="Cancel">
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              disabled={!title.trim() || !content.trim() || createLetter.isPending || updateLetter.isPending}
              style={styles.saveBtn}
              accessibilityLabel="Save letter">
              {createLetter.isPending || updateLetter.isPending ? 'Saving...' : 'Save'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B5AF7" />
      </View>
    );
  }

  if (error) {
    return <ErrorDisplay message={(error as Error).message} onRetry={() => refetch()} />;
  }

  const letters = data?.letters || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Letter Writer
        </Text>
        <Button
          mode="contained"
          onPress={() => setMode('compose')}
          style={styles.newBtn}
          accessibilityLabel="Compose new letter">
          New Letter
        </Button>
      </View>

      {letters.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No letters yet</Text>
          <Text style={styles.emptyText}>
            Use AI to draft letters for IEP requests, concerns, follow-ups, and more.
          </Text>
        </View>
      ) : (
        <FlatList
          data={letters}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <Card
              style={styles.letterCard}
              onPress={() => {
                setEditingId(item.id);
                setTitle(item.title);
                setContent(item.content);
                setRecipient(item.recipientName || '');
                setSelectedType(item.letterType);
                setMode('compose');
              }}
              accessibilityLabel={`Letter: ${item.title}`}>
              <Card.Content>
                <View style={styles.letterHeader}>
                  <Text style={styles.letterTitle}>{item.title}</Text>
                  <Chip
                    compact
                    style={{backgroundColor: STATUS_COLORS[item.status] + '20'}}
                    textStyle={{color: STATUS_COLORS[item.status], fontSize: 11}}>
                    {item.status}
                  </Chip>
                </View>
                <Text style={styles.letterMeta}>
                  {item.letterType.replace('_', ' ')} · {new Date(item.createdAt).toLocaleDateString()}
                </Text>
                {item.recipientName && (
                  <Text style={styles.letterRecipient}>To: {item.recipientName}</Text>
                )}
                <Text style={styles.letterPreview} numberOfLines={2}>
                  {item.content}
                </Text>
                <Button
                  mode="text"
                  onPress={() => handleDelete(item.id)}
                  labelStyle={{color: '#EF4444', fontSize: 12}}
                  style={styles.deleteBtn}
                  accessibilityLabel={`Delete letter ${item.title}`}>
                  Delete
                </Button>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FEFFFE'},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 16,
  },
  title: {fontSize: 28, fontWeight: '700', color: '#2D2D2D'},
  newBtn: {backgroundColor: '#5B5AF7', borderRadius: 20},
  listContent: {padding: 16, paddingTop: 0},
  letterCard: {marginBottom: 12, borderRadius: 20, backgroundColor: '#FFFFFF'},
  letterHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4},
  letterTitle: {fontSize: 16, fontWeight: '600', color: '#2D2D2D', flex: 1, marginRight: 8},
  letterMeta: {fontSize: 12, color: '#9CA3AF', marginBottom: 4, textTransform: 'capitalize'},
  letterRecipient: {fontSize: 13, color: '#6B7280', marginBottom: 4},
  letterPreview: {fontSize: 14, color: '#6B7280', lineHeight: 20},
  deleteBtn: {alignSelf: 'flex-end', marginTop: 4},
  emptyState: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32},
  emptyTitle: {fontSize: 18, fontWeight: '600', color: '#2D2D2D', marginBottom: 8},
  emptyText: {fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22},
  formContent: {padding: 16, paddingBottom: 32},
  label: {fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginTop: 16},
  typeRow: {flexGrow: 0, marginBottom: 8},
  typeChip: {marginRight: 8},
  input: {marginBottom: 12},
  contentInput: {minHeight: 200},
  generateBtn: {borderColor: '#5B5AF7', borderRadius: 20, marginBottom: 16},
  actions: {flexDirection: 'row', gap: 12, marginTop: 16},
  cancelBtn: {flex: 1, borderColor: '#E5E7EB', borderRadius: 20},
  saveBtn: {flex: 1, backgroundColor: '#5B5AF7', borderRadius: 20},
});

export default LetterWriterScreen;
