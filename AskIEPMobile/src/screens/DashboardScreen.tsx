import React, { useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { Card } from '../components/ui';
import { useChildren } from '../hooks/useChildren';
import { useChildOverview, useDashboardSummary } from '../hooks/useDashboard';

const logo = require('../../assets/images/icon.png');

const StatCard: React.FC<{
  label: string;
  value: string | number;
  color?: string;
}> = ({label, value, color = '#5B5AF7'}) => (
  <Card
    style={styles.statCard}
    accessibilityRole="summary"
    accessibilityLabel={`${label}: ${value}`}>
    <Card.Content style={styles.statContent}>
      <Text style={[styles.statValue, {color}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card.Content>
  </Card>
);

const DashboardScreen: React.FC = () => {
  const {data: childrenData} = useChildren();
  const children = childrenData?.children || [];
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const activeChildId = selectedChildId || children[0]?.id;

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useDashboardSummary();
  const {data: overviewData} = useChildOverview(activeChildId || '');

  const overview = overviewData?.data;

  if (summaryLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5B5AF7" />
      </View>
    );
  }

  if (summaryError) {
    return (
      <ErrorDisplay
        message={(summaryError as Error).message}
        onRetry={() => refetchSummary()}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Image source={logo} style={styles.heroLogo} resizeMode="contain" />
          <View>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Welcome back
            </Text>
            <Text style={styles.heroSubtitle} accessibilityRole="text">
              Your child's IEP at a glance
            </Text>
          </View>
        </View>
      </View>

      {/* Child Switcher */}
      {children.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.switcher}>
          {children.map(child => (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childTab,
                activeChildId === child.id && styles.childTabActive,
              ]}
              onPress={() => setSelectedChildId(child.id)}
              accessibilityRole="button"
              accessibilityLabel={`Switch to ${child.name}`}
              accessibilityState={{selected: activeChildId === child.id}}>
              <Text
                style={[
                  styles.childTabText,
                  activeChildId === child.id && styles.childTabTextActive,
                ]}>
                {child.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard
          label="Active Goals"
          value={summary?.statistics?.goalsInProgress ?? 0}
        />
        <StatCard
          label="Follow-ups"
          value={summary?.statistics?.pendingFollowUps ?? 0}
          color="#F59E0B"
        />
        <StatCard
          label="Contacts"
          value={summary?.statistics?.recentContactsCount ?? 0}
          color="#8B5CF6"
        />
      </View>

      {/* Goal Mastery */}
      {overview && (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Goal Progress
            </Text>
            <View style={styles.progressRow}>
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>
                  {overview.goalMastery.averageProgress}%
                </Text>
                <Text style={styles.progressLabel}>Average</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={[styles.progressValue, {color: '#10B981'}]}>
                  {overview.goalMastery.masteredGoals}
                </Text>
                <Text style={styles.progressLabel}>Mastered</Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={[styles.progressValue, {color: '#5B5AF7'}]}>
                  {overview.goalMastery.progressingGoals}
                </Text>
                <Text style={styles.progressLabel}>In Progress</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Compliance Health */}
      {overview && (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Compliance
            </Text>
            <View style={styles.complianceRow}>
              <Text style={styles.complianceValue}>
                {overview.complianceHealth.serviceDeliveryPercentage}%
              </Text>
              <Text style={styles.complianceLabel}>Service Delivery</Text>
            </View>
            {overview.complianceHealth.totalMissedSessions > 0 && (
              <Text style={styles.missedText}>
                {overview.complianceHealth.totalMissedSessions} missed sessions
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Recent Activity */}
      {summary?.recentActivity && summary.recentActivity.length > 0 && (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Recent Activity
            </Text>
            {summary.recentActivity.slice(0, 5).map(activity => (
              <View key={activity.id} style={styles.activityItem}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDate}>
                  {new Date(activity.date).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Upcoming Deadlines */}
      {summary?.upcomingDeadlines && summary.upcomingDeadlines.length > 0 && (
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle} accessibilityRole="header">
              Upcoming Deadlines
            </Text>
            {summary.upcomingDeadlines.map(deadline => (
              <View key={deadline.id} style={styles.deadlineItem}>
                <View>
                  <Text style={styles.deadlineTitle}>{deadline.title}</Text>
                  <Text style={styles.deadlineDate}>
                    {new Date(deadline.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.daysChip}>
                  <Text style={styles.daysText}>{deadline.daysUntil}d</Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FEFFFE'},
  content: {padding: 16, paddingBottom: 32},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FEFFFE'},
  hero: {backgroundColor: '#1E1B4B', borderRadius: 28, padding: 24, marginBottom: 20},
  heroContent: {flexDirection: 'row', alignItems: 'center', gap: 16},
  heroLogo: {width: 48, height: 48},
  heroTitle: {fontSize: 22, fontWeight: '700', color: '#C7D2FE'},
  heroSubtitle: {fontSize: 14, color: '#A5B4FC', marginTop: 2},
  switcher: {marginBottom: 16, flexGrow: 0},
  childTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB',
  },
  childTabActive: {backgroundColor: '#5B5AF7', borderColor: '#5B5AF7'},
  childTabText: {fontSize: 14, fontWeight: '500', color: '#6B7280'},
  childTabTextActive: {color: '#FFFFFF'},
  statsRow: {flexDirection: 'row', gap: 8, marginBottom: 16},
  statCard: {flex: 1, borderRadius: 20, backgroundColor: '#FFFFFF'},
  statContent: {alignItems: 'center', paddingVertical: 12},
  statValue: {fontSize: 24, fontWeight: '700'},
  statLabel: {fontSize: 12, color: '#6B7280', marginTop: 4},
  sectionCard: {borderRadius: 20, backgroundColor: '#FFFFFF', marginBottom: 12},
  sectionTitle: {fontSize: 16, fontWeight: '600', color: '#2D2D2D', marginBottom: 12},
  progressRow: {flexDirection: 'row', justifyContent: 'space-around'},
  progressItem: {alignItems: 'center'},
  progressValue: {fontSize: 20, fontWeight: '700', color: '#5B5AF7'},
  progressLabel: {fontSize: 12, color: '#6B7280', marginTop: 4},
  complianceRow: {flexDirection: 'row', alignItems: 'baseline', gap: 8},
  complianceValue: {fontSize: 28, fontWeight: '700', color: '#10B981'},
  complianceLabel: {fontSize: 14, color: '#6B7280'},
  missedText: {fontSize: 13, color: '#EF4444', marginTop: 8},
  activityItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  activityTitle: {fontSize: 14, color: '#374151', flex: 1},
  activityDate: {fontSize: 12, color: '#9CA3AF', marginLeft: 8},
  deadlineItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  deadlineTitle: {fontSize: 14, color: '#374151'},
  deadlineDate: {fontSize: 12, color: '#9CA3AF', marginTop: 2},
  daysChip: {backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4},
  daysText: {fontSize: 12, fontWeight: '600', color: '#D97706'},
});

export default DashboardScreen;
