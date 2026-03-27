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
import {
  useCancelAppointment,
  useCounselorCatalog,
  useCounselorSlots,
  useCreateAppointment,
  useMyAppointments,
} from '../hooks/useCounselors';
import type { CounselorService, CounselorSlot } from '../types/domain';

type ScreenMode = 'browse' | 'slots' | 'appointments';

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#F59E0B',
  ACCEPTED: '#5B5AF7',
  WAITLISTED: '#9CA3AF',
  COMPLETED: '#10B981',
  CANCELLED: '#EF4444',
};

const CounselorBookingScreen: React.FC = () => {
  const [mode, setMode] = useState<ScreenMode>('browse');
  const [selectedService, setSelectedService] = useState<CounselorService | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<CounselorSlot | null>(null);
  const [notes, setNotes] = useState('');

  const catalogQuery = useCounselorCatalog();
  const slotsQuery = useCounselorSlots(
    selectedService?.counselorId || '',
    selectedService?.id || '',
  );
  const appointmentsQuery = useMyAppointments();
  const createAppointment = useCreateAppointment();
  const cancelAppointment = useCancelAppointment();

  const handleBook = async () => {
    if (!selectedService || !selectedSlot) return;
    try {
      await createAppointment.mutateAsync({
        serviceId: selectedService.id,
        counselorId: selectedService.counselorId,
        slotId: selectedSlot.id,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Booked', 'Your appointment has been requested.');
      setSelectedService(null);
      setSelectedSlot(null);
      setNotes('');
      setMode('appointments');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleCancel = (id: string) => {
    Alert.alert('Cancel Appointment', 'Are you sure?', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Cancel Appointment',
        style: 'destructive',
        onPress: () => cancelAppointment.mutate(id),
      },
    ]);
  };

  // Slot selection view
  if (mode === 'slots' && selectedService) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title} accessibilityRole="header">Select Time</Text>
        <Text style={styles.subtitle}>
          {selectedService.name} with {selectedService.counselorName}
        </Text>
        <Text style={styles.meta}>
          {selectedService.durationMinutes} min · ${selectedService.price}
        </Text>

        {slotsQuery.isLoading ? (
          <ActivityIndicator style={styles.loader} color="#5B5AF7" />
        ) : slotsQuery.error ? (
          <ErrorDisplay message={(slotsQuery.error as Error).message} onRetry={() => slotsQuery.refetch()} />
        ) : (
          <>
            {(slotsQuery.data?.slots || []).filter(s => s.available).map(slot => (
              <Card
                key={slot.id}
                style={[styles.slotCard, selectedSlot?.id === slot.id && styles.slotSelected]}
                onPress={() => setSelectedSlot(slot)}
                accessibilityLabel={`Slot: ${new Date(slot.startTime).toLocaleString()}`}>
                <Card.Content>
                  <Text style={styles.slotTime}>
                    {new Date(slot.startTime).toLocaleDateString()} · {new Date(slot.startTime).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </Text>
                </Card.Content>
              </Card>
            ))}

            <TextInput
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              style={styles.input}
              accessibilityLabel="Appointment notes"
            />

            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={() => {setMode('browse'); setSelectedSlot(null);}}
                style={styles.backBtn}
                accessibilityLabel="Go back">
                Back
              </Button>
              <Button
                mode="contained"
                onPress={handleBook}
                disabled={!selectedSlot || createAppointment.isPending}
                style={styles.bookBtn}
                accessibilityLabel="Book appointment">
                {createAppointment.isPending ? 'Booking...' : 'Book'}
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    );
  }

  // Appointments view
  if (mode === 'appointments') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">My Appointments</Text>
          <Button
            mode="outlined"
            onPress={() => setMode('browse')}
            labelStyle={{color: '#5B5AF7'}}
            style={styles.browseBtn}
            accessibilityLabel="Browse counselors">
            Browse
          </Button>
        </View>

        {appointmentsQuery.isLoading ? (
          <ActivityIndicator style={styles.loader} color="#5B5AF7" />
        ) : appointmentsQuery.error ? (
          <ErrorDisplay message={(appointmentsQuery.error as Error).message} onRetry={() => appointmentsQuery.refetch()} />
        ) : (appointmentsQuery.data?.appointments || []).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No appointments yet</Text>
          </View>
        ) : (
          <FlatList
            data={appointmentsQuery.data?.appointments || []}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.listContent}
            renderItem={({item}) => (
              <Card style={styles.card} accessibilityLabel={`Appointment with ${item.counselorName}`}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.serviceName}</Text>
                    <Chip
                      compact
                      style={{backgroundColor: (STATUS_COLORS[item.status] || '#9CA3AF') + '20'}}
                      textStyle={{color: STATUS_COLORS[item.status] || '#9CA3AF', fontSize: 11}}>
                      {item.status}
                    </Chip>
                  </View>
                  <Text style={styles.cardMeta}>
                    {item.counselorName} · {new Date(item.date).toLocaleDateString()}
                  </Text>
                  {item.meetingLink && (
                    <Text style={styles.link}>Meeting link available</Text>
                  )}
                  {(item.status === 'REQUESTED' || item.status === 'ACCEPTED') && (
                    <Button
                      mode="text"
                      onPress={() => handleCancel(item.id)}
                      labelStyle={{color: '#EF4444', fontSize: 12}}
                      accessibilityLabel="Cancel appointment">
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

  // Browse catalog
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Counselors</Text>
        <Button
          mode="outlined"
          onPress={() => setMode('appointments')}
          labelStyle={{color: '#5B5AF7'}}
          style={styles.browseBtn}
          accessibilityLabel="View my appointments">
          My Appts
        </Button>
      </View>

      {catalogQuery.isLoading ? (
        <ActivityIndicator style={styles.loader} color="#5B5AF7" />
      ) : catalogQuery.error ? (
        <ErrorDisplay message={(catalogQuery.error as Error).message} onRetry={() => catalogQuery.refetch()} />
      ) : (catalogQuery.data?.services || []).length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No counselor services available</Text>
        </View>
      ) : (
        <FlatList
          data={catalogQuery.data?.services || []}
          keyExtractor={i => i.id}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <Card
              style={styles.card}
              onPress={() => {setSelectedService(item); setMode('slots');}}
              accessibilityLabel={`${item.name} by ${item.counselorName}`}>
              <Card.Content>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardMeta}>
                  {item.counselorName} · {item.durationMinutes} min · ${item.price}
                </Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                {item.specializations.length > 0 && (
                  <View style={styles.tags}>
                    {item.specializations.slice(0, 3).map(s => (
                      <Chip key={s} compact style={styles.tag} textStyle={styles.tagText}>
                        {s}
                      </Chip>
                    ))}
                  </View>
                )}
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
  scrollContent: {padding: 16, paddingBottom: 32},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 16,
  },
  title: {fontSize: 28, fontWeight: '700', color: '#2D2D2D'},
  subtitle: {fontSize: 16, fontWeight: '600', color: '#2D2D2D', marginBottom: 4},
  meta: {fontSize: 14, color: '#6B7280', marginBottom: 16},
  browseBtn: {borderColor: '#5B5AF7', borderRadius: 20},
  loader: {marginTop: 32},
  listContent: {padding: 16, paddingTop: 0},
  card: {marginBottom: 12, borderRadius: 20, backgroundColor: '#FFFFFF'},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4},
  cardTitle: {fontSize: 16, fontWeight: '600', color: '#2D2D2D'},
  cardMeta: {fontSize: 13, color: '#6B7280', marginBottom: 4},
  cardDesc: {fontSize: 14, color: '#6B7280', lineHeight: 20},
  link: {fontSize: 13, color: '#5B5AF7', marginTop: 4},
  tags: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8},
  tag: {backgroundColor: '#EEF2FF'},
  tagText: {fontSize: 11, color: '#5B5AF7'},
  slotCard: {marginBottom: 8, borderRadius: 16, backgroundColor: '#FFFFFF'},
  slotSelected: {borderWidth: 2, borderColor: '#5B5AF7'},
  slotTime: {fontSize: 15, color: '#2D2D2D'},
  input: {marginTop: 16},
  actions: {flexDirection: 'row', gap: 12, marginTop: 24},
  backBtn: {flex: 1, borderColor: '#E5E7EB', borderRadius: 20},
  bookBtn: {flex: 1, backgroundColor: '#5B5AF7', borderRadius: 20},
  emptyState: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32},
  emptyText: {fontSize: 16, color: '#6B7280', textAlign: 'center'},
});

export default CounselorBookingScreen;
