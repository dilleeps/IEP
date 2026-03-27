import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { Button, Card, Chip, TextInput } from '../components/ui';
import { useChildren } from '../hooks/useChildren';
import {
  useBookConsultation,
  useCancelConsultation,
  useConsultationSlots,
  useMyConsultations,
} from '../hooks/useConsultations';

const CONCERN_AREAS = [
  'IEP Review',
  'Goal Setting',
  'Behavior Support',
  'Transition Planning',
  'School Communication',
  'Dispute Resolution',
  'Accommodations',
  'Evaluation',
];

type ScreenMode = 'browse' | 'mine';

const ExpertConsultationScreen: React.FC = () => {
  const [mode, setMode] = useState<ScreenMode>('browse');
  const [selectedConcern, setSelectedConcern] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [notes, setNotes] = useState('');

  const {data: childrenData} = useChildren();
  const firstChildId = childrenData?.children?.[0]?.id || '';

  const slotsQuery = useConsultationSlots();
  const consultationsQuery = useMyConsultations();
  const bookConsultation = useBookConsultation();
  const cancelConsultation = useCancelConsultation();

  const handleBook = async () => {
    if (!selectedSlotId || !selectedConcern) return;
    try {
      await bookConsultation.mutateAsync({
        slotId: selectedSlotId,
        concernArea: selectedConcern,
        notes: notes.trim() || undefined,
        childId: firstChildId || undefined,
      });
      Alert.alert('Booked', 'Your consultation has been scheduled.');
      setSelectedSlotId('');
      setSelectedConcern('');
      setNotes('');
      setMode('mine');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Consultation', 'Are you sure?', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Cancel',
        style: 'destructive',
        onPress: () => cancelConsultation.mutate(id),
      },
    ]);
  };

  if (mode === 'mine') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">My Consultations</Text>
          <Button
            mode="outlined"
            onPress={() => setMode('browse')}
            labelStyle={{color: '#5B5AF7'}}
            style={styles.switchBtn}
            accessibilityLabel="Book new consultation">
            Book New
          </Button>
        </View>

        {consultationsQuery.isLoading ? (
          <ActivityIndicator style={styles.loader} color="#5B5AF7" />
        ) : consultationsQuery.error ? (
          <ErrorDisplay message={(consultationsQuery.error as Error).message} onRetry={() => consultationsQuery.refetch()} />
        ) : (consultationsQuery.data?.consultations || []).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No consultations scheduled</Text>
          </View>
        ) : (
          <FlatList
            data={consultationsQuery.data?.consultations || []}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.listContent}
            renderItem={({item}) => (
              <Card style={styles.card} accessibilityLabel={`Consultation with ${item.expertName}`}>
                <Card.Content>
                  <Text style={styles.cardTitle}>{item.expertName}</Text>
                  <Text style={styles.cardMeta}>
                    {item.concernArea} · {new Date(item.date).toLocaleDateString()}
                  </Text>
                  <Chip compact style={styles.statusChip}>
                    {item.status}
                  </Chip>
                  {item.status === 'scheduled' && (
                    <Button
                      mode="text"
                      onPress={() => handleCancel(item.id)}
                      labelStyle={{color: '#EF4444', fontSize: 12}}
                      accessibilityLabel="Cancel consultation">
                      Cancel
                    </Button>
                  )}
                </Card.Content>
              </Card>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Expert Consultation</Text>
        <Button
          mode="outlined"
          onPress={() => setMode('mine')}
          labelStyle={{color: '#5B5AF7'}}
          style={styles.switchBtn}
          accessibilityLabel="View my consultations">
          My Consults
        </Button>
      </View>

      <Text style={styles.sectionTitle}>Select Concern Area</Text>
      <View style={styles.concernGrid}>
        {CONCERN_AREAS.map(area => (
          <Chip
            key={area}
            selected={selectedConcern === area}
            onPress={() => setSelectedConcern(area)}
            style={styles.concernChip}>
            {area}
          </Chip>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Available Experts</Text>

      {slotsQuery.isLoading ? (
        <ActivityIndicator style={styles.loader} color="#5B5AF7" />
      ) : slotsQuery.error ? (
        <ErrorDisplay message={(slotsQuery.error as Error).message} onRetry={() => slotsQuery.refetch()} />
      ) : (slotsQuery.data?.slots || []).filter(s => s.available).length === 0 ? (
        <Text style={styles.emptyText}>No slots available right now</Text>
      ) : (
        (slotsQuery.data?.slots || []).filter(s => s.available).map(slot => (
          <Card
            key={slot.id}
            style={[styles.slotCard, selectedSlotId === slot.id && styles.slotSelected]}
            onPress={() => setSelectedSlotId(slot.id)}
            accessibilityLabel={`${slot.expertName} - ${new Date(slot.date).toLocaleDateString()}`}>
            <Card.Content>
              <Text style={styles.expertName}>{slot.expertName}</Text>
              <Text style={styles.expertTitle}>{slot.expertTitle}</Text>
              <Text style={styles.slotTime}>
                {new Date(slot.date).toLocaleDateString()} · {new Date(slot.startTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
              </Text>
            </Card.Content>
          </Card>
        ))
      )}

      <TextInput
        label="Additional notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        style={styles.input}
        accessibilityLabel="Consultation notes"
      />

      <Button
        mode="contained"
        onPress={handleBook}
        disabled={!selectedSlotId || !selectedConcern || bookConsultation.isPending}
        style={styles.bookBtn}
        accessibilityLabel="Book consultation">
        {bookConsultation.isPending ? 'Booking...' : 'Book Consultation'}
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FEFFFE'},
  scrollContent: {padding: 16, paddingBottom: 32},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
  },
  title: {fontSize: 28, fontWeight: '700', color: '#2D2D2D'},
  switchBtn: {borderColor: '#5B5AF7', borderRadius: 20},
  sectionTitle: {fontSize: 16, fontWeight: '600', color: '#2D2D2D', marginTop: 16, marginBottom: 12},
  concernGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  concernChip: {marginBottom: 4},
  loader: {marginTop: 32},
  slotCard: {marginBottom: 8, borderRadius: 16, backgroundColor: '#FFFFFF'},
  slotSelected: {borderWidth: 2, borderColor: '#5B5AF7'},
  expertName: {fontSize: 16, fontWeight: '600', color: '#2D2D2D'},
  expertTitle: {fontSize: 13, color: '#6B7280', marginBottom: 4},
  slotTime: {fontSize: 14, color: '#5B5AF7'},
  input: {marginTop: 16},
  bookBtn: {backgroundColor: '#5B5AF7', borderRadius: 20, marginTop: 24},
  listContent: {padding: 16, paddingTop: 0},
  card: {marginBottom: 12, borderRadius: 20, backgroundColor: '#FFFFFF'},
  cardTitle: {fontSize: 16, fontWeight: '600', color: '#2D2D2D'},
  cardMeta: {fontSize: 13, color: '#6B7280', marginBottom: 8},
  statusChip: {alignSelf: 'flex-start'},
  emptyState: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32},
  emptyText: {fontSize: 16, color: '#6B7280', textAlign: 'center'},
});

export default ExpertConsultationScreen;
