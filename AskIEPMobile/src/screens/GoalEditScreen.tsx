import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useCreateGoal, useGoals, useUpdateGoal } from '../hooks/useGoals';

const DOMAINS = [
  'Academic', 'Communication', 'Social/Emotional', 'Motor Skills',
  'Self-Help', 'Behavior', 'Transition', 'Other',
];

const GoalEditScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{id?: string}>();
  const isEditing = !!params.id;

  const {data: childrenData} = useChildren();
  const firstChildId = childrenData?.children?.[0]?.id || '';
  const {data: goalsData} = useGoals(firstChildId);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const [goalName, setGoalName] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('Academic');
  const [baseline, setBaseline] = useState('');
  const [target, setTarget] = useState('');
  const [metric, setMetric] = useState('');
  const [startDate, setStartDate] = useState('');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    if (isEditing && goalsData?.goals) {
      const goal = goalsData.goals.find(g => g.id === params.id);
      if (goal) {
        setGoalName(goal.goalName);
        setDescription(goal.description || '');
        setDomain(goal.domain);
        setBaseline(goal.baseline?.toString() || '');
        setTarget(goal.target?.toString() || '');
        setMetric(goal.metric || '');
        setStartDate(goal.startDate || '');
        setTargetDate(goal.targetDate || '');
      }
    }
  }, [isEditing, goalsData, params.id]);

  const handleSave = async () => {
    if (!goalName.trim() || !firstChildId) return;
    try {
      if (isEditing) {
        await updateGoal.mutateAsync({
          id: params.id!,
          data: {
            goalName: goalName.trim(),
            description: description.trim(),
            domain,
            baseline: baseline ? Number(baseline) : undefined,
            target: target ? Number(target) : undefined,
            metric: metric.trim() || undefined,
            startDate: startDate || undefined,
            targetDate: targetDate || undefined,
          },
        });
      } else {
        await createGoal.mutateAsync({
          childId: firstChildId,
          goalName: goalName.trim(),
          description: description.trim(),
          domain,
          baseline: baseline ? Number(baseline) : undefined,
          target: target ? Number(target) : undefined,
          metric: metric.trim() || undefined,
          startDate: startDate || undefined,
          targetDate: targetDate || undefined,
        });
      }
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
          {isEditing ? 'Edit Goal' : 'New Goal'}
        </Text>

        <TextInput
          label="Goal Name *"
          value={goalName}
          onChangeText={setGoalName}
          style={styles.input}
          accessibilityLabel="Goal name"
        />
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.input}
          accessibilityLabel="Goal description"
        />

        <Text style={styles.label}>Domain</Text>
        <View style={styles.domainGrid}>
          {DOMAINS.map(d => (
            <Button
              key={d}
              mode={domain === d ? 'contained' : 'outlined'}
              onPress={() => setDomain(d)}
              style={[styles.domainBtn, domain === d && styles.domainBtnActive]}
              labelStyle={domain === d ? styles.domainTextActive : styles.domainText}
              accessibilityLabel={`Domain: ${d}`}>
              {d}
            </Button>
          ))}
        </View>

        <View style={styles.row}>
          <TextInput
            label="Baseline"
            value={baseline}
            onChangeText={setBaseline}
            keyboardType="numeric"
            style={[styles.input, styles.halfInput]}
            accessibilityLabel="Baseline value"
          />
          <TextInput
            label="Target"
            value={target}
            onChangeText={setTarget}
            keyboardType="numeric"
            style={[styles.input, styles.halfInput]}
            accessibilityLabel="Target value"
          />
        </View>

        <TextInput
          label="Metric (e.g., % accuracy, trials)"
          value={metric}
          onChangeText={setMetric}
          style={styles.input}
          accessibilityLabel="Measurement metric"
        />

        <View style={styles.row}>
          <TextInput
            label="Start Date (YYYY-MM-DD)"
            value={startDate}
            onChangeText={setStartDate}
            style={[styles.input, styles.halfInput]}
            accessibilityLabel="Start date"
          />
          <TextInput
            label="Target Date (YYYY-MM-DD)"
            value={targetDate}
            onChangeText={setTargetDate}
            style={[styles.input, styles.halfInput]}
            accessibilityLabel="Target date"
          />
        </View>

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
            disabled={!goalName.trim() || createGoal.isPending || updateGoal.isPending}
            style={styles.saveBtn}
            accessibilityLabel="Save goal">
            {createGoal.isPending || updateGoal.isPending ? 'Saving...' : 'Save'}
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
  domainGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16},
  domainBtn: {borderColor: '#E5E7EB', borderRadius: 20},
  domainBtnActive: {backgroundColor: '#5B5AF7', borderColor: '#5B5AF7'},
  domainText: {color: '#6B7280', fontSize: 13},
  domainTextActive: {color: '#FFFFFF', fontSize: 13},
  row: {flexDirection: 'row', gap: 12},
  halfInput: {flex: 1},
  actions: {flexDirection: 'row', gap: 12, marginTop: 24},
  cancelBtn: {flex: 1, borderColor: '#E5E7EB', borderRadius: 20},
  saveBtn: {flex: 1, backgroundColor: '#5B5AF7', borderRadius: 20},
});

export default GoalEditScreen;
