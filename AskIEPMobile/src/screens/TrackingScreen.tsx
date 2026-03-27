import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { Card, Chip, FAB, ProgressBar, SegmentedButtons } from '../components/ui';
import { useBehaviors, type BehaviorEntry } from '../hooks/useBehaviors';
import { useChildren } from '../hooks/useChildren';
import { useCommunications, type Communication } from '../hooks/useCommunications';
import { useServices, type ServiceCompliance } from '../hooks/useCompliance';
import { useGoals, type Goal } from '../hooks/useGoals';

type Tab = 'goals' | 'behavior' | 'compliance' | 'contacts';

const FAB_ROUTES: Record<Tab, string> = {
  goals: '/goal-edit',
  behavior: '/behavior-edit',
  compliance: '/compliance-edit',
  contacts: '/contact-edit',
};

const GoalCard: React.FC<{goal: Goal; onPress: () => void}> = ({goal, onPress}) => (
  <Card
    style={styles.itemCard}
    onPress={onPress}
    accessibilityLabel={`Goal: ${goal.goalName}, ${goal.progressPercentage}% complete`}>
    <Card.Content>
      <Text style={styles.itemTitle}>{goal.goalName}</Text>
      <Text style={styles.itemSubtitle} accessibilityRole="text">
        {goal.domain}
      </Text>
      <ProgressBar
        progress={goal.progressPercentage / 100}
        color="#5B5AF7"
        style={styles.progressBar}
        accessibilityLabel={`${goal.goalName} progress`}
      />
      <Text style={styles.progressText} accessibilityRole="text">
        {goal.progressPercentage}% complete
      </Text>
    </Card.Content>
  </Card>
);

const BehaviorCard: React.FC<{entry: BehaviorEntry}> = ({entry}) => (
  <Card
    style={styles.itemCard}
    accessibilityLabel={`Behavior entry from ${new Date(entry.date).toLocaleDateString()}`}>
    <Card.Content>
      <Text style={styles.itemDate} accessibilityRole="text">
        {new Date(entry.date).toLocaleDateString()}
      </Text>
      <View style={styles.abcRow}>
        <Chip compact style={styles.abcChip} textStyle={styles.abcText}>
          A: {entry.antecedent}
        </Chip>
      </View>
      <View style={styles.abcRow}>
        <Chip compact style={styles.abcChip} textStyle={styles.abcText}>
          B: {entry.behavior}
        </Chip>
      </View>
      <View style={styles.abcRow}>
        <Chip compact style={styles.abcChip} textStyle={styles.abcText}>
          C: {entry.consequence}
        </Chip>
      </View>
    </Card.Content>
  </Card>
);

const ServiceCard: React.FC<{service: ServiceCompliance}> = ({service}) => (
  <Card
    style={styles.itemCard}
    accessibilityLabel={`Service: ${service.name}, ${service.met} met, ${service.missed} missed`}>
    <Card.Content>
      <Text style={styles.itemTitle}>{service.name}</Text>
      <Text style={styles.itemSubtitle}>{service.frequency}</Text>
      <View style={styles.serviceStats}>
        <View style={styles.statBadge}>
          <Text style={[styles.statNum, {color: '#10B981'}]}>{service.met}</Text>
          <Text style={styles.statLabel}>Met</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={[styles.statNum, {color: '#EF4444'}]}>{service.missed}</Text>
          <Text style={styles.statLabel}>Missed</Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={[styles.statNum, {color: '#F59E0B'}]}>{service.upcoming}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
      </View>
    </Card.Content>
  </Card>
);

const CommCard: React.FC<{comm: Communication}> = ({comm}) => (
  <Card
    style={styles.itemCard}
    accessibilityLabel={`Communication: ${comm.subject}`}>
    <Card.Content>
      <Text style={styles.itemTitle}>{comm.subject}</Text>
      <Text style={styles.itemSubtitle}>
        {comm.type} · {new Date(comm.date).toLocaleDateString()}
      </Text>
      {comm.followUpDate && (
        <Text style={styles.followUp}>
          Follow-up: {new Date(comm.followUpDate).toLocaleDateString()}
        </Text>
      )}
    </Card.Content>
  </Card>
);

const TrackingScreen: React.FC = () => {
  const [tab, setTab] = useState<Tab>('goals');
  const router = useRouter();
  const {data: childrenData} = useChildren();
  const firstChildId = childrenData?.children?.[0]?.id || '';

  const goalsQuery = useGoals(firstChildId);
  const behaviorsQuery = useBehaviors(firstChildId);
  const servicesQuery = useServices(firstChildId);
  const commsQuery = useCommunications(firstChildId);

  const renderContent = () => {
    switch (tab) {
      case 'goals': {
        if (goalsQuery.isLoading)
          return <ActivityIndicator style={styles.loader} color="#5B5AF7" />;
        if (goalsQuery.error)
          return (
            <ErrorDisplay
              message={(goalsQuery.error as Error).message}
              onRetry={() => goalsQuery.refetch()}
            />
          );
        const goals = goalsQuery.data?.goals || [];
        return goals.length === 0 ? (
          <Text style={styles.emptyText}>No goals tracked yet</Text>
        ) : (
          <FlatList
            data={goals}
            keyExtractor={i => i.id}
            renderItem={({item}) => (
              <GoalCard
                goal={item}
                onPress={() => router.push(`/goal-edit?id=${item.id}`)}
              />
            )}
          />
        );
      }
      case 'behavior': {
        if (behaviorsQuery.isLoading)
          return <ActivityIndicator style={styles.loader} color="#5B5AF7" />;
        if (behaviorsQuery.error)
          return (
            <ErrorDisplay
              message={(behaviorsQuery.error as Error).message}
              onRetry={() => behaviorsQuery.refetch()}
            />
          );
        const behaviors = behaviorsQuery.data?.behaviors || [];
        return behaviors.length === 0 ? (
          <Text style={styles.emptyText}>No behavior entries yet</Text>
        ) : (
          <FlatList
            data={behaviors}
            keyExtractor={i => i.id}
            renderItem={({item}) => <BehaviorCard entry={item} />}
          />
        );
      }
      case 'compliance': {
        if (servicesQuery.isLoading)
          return <ActivityIndicator style={styles.loader} color="#5B5AF7" />;
        if (servicesQuery.error)
          return (
            <ErrorDisplay
              message={(servicesQuery.error as Error).message}
              onRetry={() => servicesQuery.refetch()}
            />
          );
        const services = servicesQuery.data?.services || [];
        return services.length === 0 ? (
          <Text style={styles.emptyText}>No services defined yet</Text>
        ) : (
          <FlatList
            data={services}
            keyExtractor={i => i.id}
            renderItem={({item}) => <ServiceCard service={item} />}
          />
        );
      }
      case 'contacts': {
        if (commsQuery.isLoading)
          return <ActivityIndicator style={styles.loader} color="#5B5AF7" />;
        if (commsQuery.error)
          return (
            <ErrorDisplay
              message={(commsQuery.error as Error).message}
              onRetry={() => commsQuery.refetch()}
            />
          );
        const comms = commsQuery.data?.communications || [];
        return comms.length === 0 ? (
          <Text style={styles.emptyText}>No communications logged yet</Text>
        ) : (
          <FlatList
            data={comms}
            keyExtractor={i => i.id}
            renderItem={({item}) => <CommCard comm={item} />}
          />
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Tracking
      </Text>
      <SegmentedButtons
        value={tab}
        onValueChange={v => setTab(v as Tab)}
        buttons={[
          {value: 'goals', label: 'Goals', accessibilityLabel: 'Goals tab'},
          {value: 'behavior', label: 'Behavior', accessibilityLabel: 'Behavior tab'},
          {value: 'compliance', label: 'Services', accessibilityLabel: 'Services tab'},
          {value: 'contacts', label: 'Comms', accessibilityLabel: 'Communications tab'},
        ]}
        style={styles.tabs}
      />
      <View style={styles.content}>{renderContent()}</View>
      <FAB
        icon="plus"
        onPress={() => router.push(FAB_ROUTES[tab] as any)}
        style={styles.fab}
        accessibilityLabel={`Add new ${tab === 'goals' ? 'goal' : tab === 'behavior' ? 'behavior entry' : tab === 'compliance' ? 'service entry' : 'communication'}`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FEFFFE', padding: 16},
  title: {fontSize: 28, fontWeight: '700', color: '#2D2D2D', marginBottom: 16, marginTop: 16},
  tabs: {marginBottom: 16},
  content: {flex: 1},
  loader: {marginTop: 32},
  itemCard: {marginBottom: 12, borderRadius: 20, backgroundColor: '#FFFFFF'},
  itemTitle: {fontSize: 16, fontWeight: '600', color: '#2D2D2D', marginBottom: 4},
  itemSubtitle: {fontSize: 13, color: '#6B7280', marginBottom: 8},
  itemDate: {fontSize: 12, color: '#9CA3AF', marginBottom: 8},
  progressBar: {height: 6, borderRadius: 3, marginBottom: 4},
  progressText: {fontSize: 12, color: '#6B7280'},
  abcRow: {marginBottom: 4},
  abcChip: {alignSelf: 'flex-start'},
  abcText: {fontSize: 12},
  serviceStats: {flexDirection: 'row', gap: 16, marginTop: 4},
  statBadge: {alignItems: 'center'},
  statNum: {fontSize: 18, fontWeight: '700'},
  statLabel: {fontSize: 11, color: '#6B7280'},
  followUp: {fontSize: 12, color: '#F59E0B', fontWeight: '500', marginTop: 4},
  emptyText: {
    fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 48,
  },
  fab: {
    position: 'absolute', right: 16, bottom: 16,
  },
});

export default TrackingScreen;
