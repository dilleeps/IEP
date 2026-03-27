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
import { useCreateService } from '../hooks/useCompliance';

const ComplianceEditScreen: React.FC = () => {
  const router = useRouter();
  const {data: childrenData} = useChildren();
  const firstChildId = childrenData?.children?.[0]?.id || '';
  const createService = useCreateService();

  const [serviceType, setServiceType] = useState('');
  const [serviceProvider, setServiceProvider] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [status, setStatus] = useState<'provided' | 'scheduled' | 'missed'>('provided');
  const [minutesProvided, setMinutesProvided] = useState('');
  const [minutesRequired, setMinutesRequired] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!serviceType.trim() || !serviceProvider.trim() || !serviceDate.trim() || !firstChildId) return;
    try {
      await createService.mutateAsync({
        childId: firstChildId,
        serviceType: serviceType.trim(),
        serviceProvider: serviceProvider.trim(),
        serviceDate: serviceDate.trim(),
        status,
        minutesProvided: minutesProvided ? Number(minutesProvided) : undefined,
        minutesRequired: minutesRequired ? Number(minutesRequired) : undefined,
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
          Log Service
        </Text>

        <TextInput
          label="Service Type *"
          value={serviceType}
          onChangeText={setServiceType}
          style={styles.input}
          placeholder="e.g., Speech Therapy, OT, PT"
          accessibilityLabel="Service type"
        />
        <TextInput
          label="Service Provider *"
          value={serviceProvider}
          onChangeText={setServiceProvider}
          style={styles.input}
          accessibilityLabel="Service provider name"
        />
        <TextInput
          label="Date * (YYYY-MM-DD)"
          value={serviceDate}
          onChangeText={setServiceDate}
          style={styles.input}
          accessibilityLabel="Service date"
        />

        <Text style={styles.label}>Status</Text>
        <SegmentedButtons
          value={status}
          onValueChange={v => setStatus(v as 'provided' | 'scheduled' | 'missed')}
          buttons={[
            {value: 'provided', label: 'Provided', accessibilityLabel: 'Service provided'},
            {value: 'scheduled', label: 'Scheduled', accessibilityLabel: 'Service scheduled'},
            {value: 'missed', label: 'Missed', accessibilityLabel: 'Service missed'},
          ]}
          style={styles.statusToggle}
        />

        <View style={styles.row}>
          <TextInput
            label="Minutes Provided"
            value={minutesProvided}
            onChangeText={setMinutesProvided}
            keyboardType="numeric"
            style={[styles.input, styles.halfInput]}
            accessibilityLabel="Minutes provided"
          />
          <TextInput
            label="Minutes Required"
            value={minutesRequired}
            onChangeText={setMinutesRequired}
            keyboardType="numeric"
            style={[styles.input, styles.halfInput]}
            accessibilityLabel="Minutes required"
          />
        </View>

        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={styles.input}
          accessibilityLabel="Notes"
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
            disabled={!serviceType.trim() || !serviceProvider.trim() || !serviceDate.trim() || createService.isPending}
            style={styles.saveBtn}
            accessibilityLabel="Save service entry">
            {createService.isPending ? 'Saving...' : 'Save'}
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
  input: {marginBottom: 12},
  label: {fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8},
  statusToggle: {marginBottom: 16},
  row: {flexDirection: 'row', gap: 12},
  halfInput: {flex: 1},
  actions: {flexDirection: 'row', gap: 12, marginTop: 24},
  cancelBtn: {flex: 1, borderColor: '#E5E7EB', borderRadius: 20},
  saveBtn: {flex: 1, backgroundColor: '#5B5AF7', borderRadius: 20},
});

export default ComplianceEditScreen;
