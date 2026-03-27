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
import { Button, SegmentedButtons, TextInput } from '../components/ui';
import { useChildren } from '../hooks/useChildren';
import { useCreateCommunication } from '../hooks/useCommunications';

const ContactEditScreen: React.FC = () => {
  const router = useRouter();
  const {data: childrenData} = useChildren();
  const firstChildId = childrenData?.children?.[0]?.id || '';
  const createCommunication = useCreateCommunication();

  const [type, setType] = useState('email');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [subject, setSubject] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [noteText, setNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const handleSave = async () => {
    if (!subject.trim() || !firstChildId) return;
    try {
      await createCommunication.mutateAsync({
        childId: firstChildId,
        type,
        date,
        subject: subject.trim(),
        contactPerson: contactPerson.trim() || undefined,
        notes: noteText.trim(),
        followUpDate: followUpDate || undefined,
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
          Log Communication
        </Text>

        <Text style={styles.label}>Type</Text>
        <SegmentedButtons
          value={type}
          onValueChange={setType}
          buttons={[
            {value: 'email', label: 'Email', accessibilityLabel: 'Email'},
            {value: 'phone', label: 'Phone', accessibilityLabel: 'Phone'},
            {value: 'meeting', label: 'Meeting', accessibilityLabel: 'Meeting'},
            {value: 'letter', label: 'Letter', accessibilityLabel: 'Letter'},
          ]}
          style={styles.typeToggle}
        />

        <TextInput
          label="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
          style={styles.input}
          accessibilityLabel="Communication date"
        />

        <TextInput
          label="Contact Person"
          value={contactPerson}
          onChangeText={setContactPerson}
          style={styles.input}
          accessibilityLabel="Contact person name"
        />

        <TextInput
          label="Subject *"
          value={subject}
          onChangeText={setSubject}
          style={styles.input}
          accessibilityLabel="Subject"
        />

        <TextInput
          label="Notes"
          value={noteText}
          onChangeText={setNoteText}
          multiline
          numberOfLines={4}
          style={styles.input}
          accessibilityLabel="Communication notes"
        />

        <TextInput
          label="Follow-up Date (YYYY-MM-DD)"
          value={followUpDate}
          onChangeText={setFollowUpDate}
          style={styles.input}
          accessibilityLabel="Follow-up date"
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
            disabled={!subject.trim() || createCommunication.isPending}
            style={styles.saveBtn}
            accessibilityLabel="Save communication">
            {createCommunication.isPending ? 'Saving...' : 'Save'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FEFFFE'},
  content: {padding: 16, paddingBottom: 32},
  title: {fontSize: 28, fontWeight: '700', color: '#2D2D2D', marginBottom: 16, marginTop: 16},
  label: {fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8},
  typeToggle: {marginBottom: 16},
  input: {marginBottom: 12},
  actions: {flexDirection: 'row', gap: 12, marginTop: 24},
  cancelBtn: {flex: 1, borderColor: '#E5E7EB', borderRadius: 20},
  saveBtn: {flex: 1, backgroundColor: '#5B5AF7', borderRadius: 20},
});

export default ContactEditScreen;
