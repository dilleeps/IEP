import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { Button, Card, FAB, IconButton, TextInput } from '../components/ui';
import { useChildren, useCreateChild, useDeleteChild } from '../hooks/useChildren';
import type { Child } from '../types/domain';

const ChildCard: React.FC<{
  child: Child;
  onDelete: (id: string) => void;
}> = ({child, onDelete}) => {
  const handleDelete = () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete this child profile? This cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: () => onDelete(child.id)},
      ],
    );
  };

  return (
    <Card style={styles.card} accessibilityLabel={`Child profile: ${child.name}`}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.childName} accessibilityRole="header">
              {child.name}
            </Text>
            <Text style={styles.childDetail}>
              {[child.grade, child.schoolName].filter(Boolean).join(' · ') ||
                'No details yet'}
            </Text>
            {child.disabilities && child.disabilities.length > 0 && (
              <View style={styles.tags}>
                {child.disabilities.map((d, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{d}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <IconButton
            icon="delete-outline"
            iconColor="#EF4444"
            onPress={handleDelete}
            accessibilityLabel="Delete child profile"
          />
        </View>
      </Card.Content>
    </Card>
  );
};

const AddChildForm: React.FC<{
  onSubmit: (name: string) => void;
  onCancel: () => void;
  submitting: boolean;
}> = ({onSubmit, onCancel, submitting}) => {
  const [name, setName] = useState('');

  return (
    <Card style={styles.formCard}>
      <Card.Content>
        <Text style={styles.formTitle} accessibilityRole="header">
          Add Child
        </Text>
        <TextInput
          label="Child's Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          autoFocus
          accessibilityLabel="Child's name"
          accessibilityHint="Enter the name of the child to add"
        />
        <View style={styles.formActions}>
          <Button mode="text" onPress={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={() => onSubmit(name)}
            disabled={!name.trim() || submitting}
            loading={submitting}
            style={styles.submitButton}>
            Add
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
};

const ChildrenScreen: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const {data, isLoading, error, refetch} = useChildren();
  const createChild = useCreateChild();
  const deleteChild = useDeleteChild();

  const handleCreate = async (name: string) => {
    try {
      await createChild.mutateAsync({name});
      setShowForm(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not add child');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChild.mutateAsync(id);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not delete child profile');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B5AF7" />
      </View>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        message={(error as Error).message}
        onRetry={() => refetch()}
      />
    );
  }

  const children = data?.children || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Children
      </Text>

      {showForm && (
        <AddChildForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          submitting={createChild.isPending}
        />
      )}

      {children.length === 0 && !showForm ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No children added yet</Text>
          <Text style={styles.emptySubtext}>
            Add your first child to start managing their IEP
          </Text>
        </View>
      ) : (
        <FlatList
          data={children}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <ChildCard child={item} onDelete={handleDelete} />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      {!showForm && (
        <FAB
          icon="plus"
          onPress={() => setShowForm(true)}
          style={styles.fab}
          label="Add Child"
          accessibilityLabel="Add child"
          accessibilityHint="Opens form to add a new child profile"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FEFFFE', padding: 16},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 28, fontWeight: '700', color: '#2D2D2D', marginBottom: 16, marginTop: 16},
  card: {borderRadius: 20, backgroundColor: '#FFFFFF', marginBottom: 12},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  cardInfo: {flex: 1},
  childName: {fontSize: 18, fontWeight: '700', color: '#2D2D2D', marginBottom: 4},
  childDetail: {fontSize: 14, color: '#6B7280', marginBottom: 8},
  tags: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  tag: {
    backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  tagText: {fontSize: 12, color: '#5B5AF7', fontWeight: '500'},
  formCard: {borderRadius: 20, backgroundColor: '#FFFFFF', marginBottom: 12},
  formTitle: {fontSize: 18, fontWeight: '700', color: '#2D2D2D', marginBottom: 16},
  input: {marginBottom: 16},
  formActions: {flexDirection: 'row', justifyContent: 'flex-end', gap: 8},
  submitButton: {borderRadius: 20},
  empty: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  emptyText: {fontSize: 18, fontWeight: '600', color: '#2D2D2D', marginBottom: 8},
  emptySubtext: {fontSize: 14, color: '#6B7280', textAlign: 'center'},
  list: {paddingBottom: 100},
  fab: {position: 'absolute', right: 16, bottom: 24},
});

export default ChildrenScreen;
