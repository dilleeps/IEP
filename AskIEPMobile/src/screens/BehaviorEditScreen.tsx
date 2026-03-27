import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, TextInput } from '../components/ui';
import { useChildren } from '../hooks/useChildren';
import { useCreateBehavior } from '../hooks/useBehaviors';

const BehaviorEditScreen: React.FC = () => {
  const router = useRouter();
  const {data: childrenData} = useChildren();
  const firstChildId = childrenData?.children?.[0]?.id || '';
  const createBehavior = useCreateBehavior();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [antecedent, setAntecedent] = useState('');
  const [behavior, setBehavior] = useState('');
  const [consequence, setConsequence] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!antecedent.trim() || !behavior.trim() || !consequence.trim() || !firstChildId) return;
    try {
      await createBehavior.mutateAsync({
        childId: firstChildId,
        date,
        antecedent: antecedent.trim(),
        behavior: behavior.trim(),
        consequence: consequence.trim(),
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Log Behavior
        </Text>

        <Text style={styles.info}>
          Use the ABC model to track behavior patterns: what happened before (Antecedent),
          the behavior itself, and what happened after (Consequence).
        </Text>

        <TextInput
          label="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          style={styles.input}
          accessibilityLabel="Date"
        />

        <TextInput
          label="Antecedent (What happened before?) *"
          value={antecedent}
          onChangeText={setAntecedent}
          multiline
          numberOfLines={3}
          style={styles.input}
          accessibilityLabel="Antecedent - what happened before the behavior"
        />

        <TextInput
          label="Behavior (What did the child do?) *"
          value={behavior}
          onChangeText={setBehavior}
          multiline
          numberOfLines={3}
          style={styles.input}
          accessibilityLabel="The behavior observed"
        />

        <TextInput
          label="Consequence (What happened after?) *"
          value={consequence}
          onChangeText={setConsequence}
          multiline
          numberOfLines={3}
          style={styles.input}
          accessibilityLabel="Consequence - what happened after the behavior"
        />

        <TextInput
          label="Additional Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
          style={styles.input}
          accessibilityLabel="Additional notes"
        />

        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.cancelBtn}
            accessibilityLabel="Cancel">
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={!antecedent.trim() || !behavior.trim() || !consequence.trim() || createBehavior.isPending}
            style={styles.saveBtn}
            accessibilityLabel="Save behavior entry">
            {createBehavior.isPending ? 'Saving...' : 'Save'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FEFFFE'},
  content: {padding: 16, paddingBottom: 32},
  title: {fontSize: 28, fontWeight: '700', color: '#2D2D2D', marginBottom: 8, marginTop: 16},
  info: {fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 16},
  input: {marginBottom: 12},
  actions: {flexDirection: 'row', gap: 12, marginTop: 24},
  cancelBtn: {flex: 1, borderColor: '#E5E7EB', borderRadius: 20},
  saveBtn: {flex: 1, backgroundColor: '#5B5AF7', borderRadius: 20},
});

export default BehaviorEditScreen;
