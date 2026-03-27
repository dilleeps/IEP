import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { Button, Card, Chip, SegmentedButtons } from '../components/ui';
import { usePlans, useSubscribe } from '../hooks/useBilling';
import { useAuth } from '../providers/AuthProvider';

const SubscriptionScreen: React.FC = () => {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const {data, isLoading, error, refetch} = usePlans();
  const subscribe = useSubscribe();
  const {user} = useAuth();

  const handleSubscribe = (planId: string, planName: string) => {
    Alert.alert(
      'Subscribe',
      `Subscribe to ${planName} (${interval})?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Subscribe',
          onPress: async () => {
            try {
              await subscribe.mutateAsync({planId, interval});
              Alert.alert('Success', `You are now subscribed to ${planName}.`);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ],
    );
  };

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

  const plans = data?.plans || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">
        Subscription Plans
      </Text>

      {user?.subscriptionPlan && (
        <View style={styles.currentPlan}>
          <Text style={styles.currentLabel}>Current Plan</Text>
          <Text style={styles.currentValue}>{user.subscriptionPlan}</Text>
        </View>
      )}

      <SegmentedButtons
        value={interval}
        onValueChange={v => setInterval(v as 'monthly' | 'yearly')}
        buttons={[
          {value: 'monthly', label: 'Monthly', accessibilityLabel: 'Monthly billing'},
          {value: 'yearly', label: 'Yearly (Save 20%)', accessibilityLabel: 'Yearly billing'},
        ]}
        style={styles.toggle}
      />

      {plans.map(plan => (
        <Card
          key={plan.id}
          style={[styles.planCard, plan.isPopular && styles.popularCard]}
          accessibilityLabel={`${plan.name} plan`}>
          <Card.Content>
            {plan.isPopular && (
              <Chip compact style={styles.popularChip} textStyle={styles.popularText}>
                Most Popular
              </Chip>
            )}
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planDesc}>{plan.description}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>
                ${interval === 'monthly' ? plan.priceMonthly : plan.priceYearly}
              </Text>
              <Text style={styles.priceLabel}>
                /{interval === 'monthly' ? 'mo' : 'yr'}
              </Text>
            </View>

            <View style={styles.features}>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Text style={styles.checkmark}>&#10003;</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <Button
              mode={plan.isPopular ? 'contained' : 'outlined'}
              onPress={() => handleSubscribe(plan.id, plan.name)}
              disabled={subscribe.isPending}
              style={plan.isPopular ? styles.popularBtn : styles.planBtn}
              labelStyle={plan.isPopular ? undefined : {color: '#5B5AF7'}}
              accessibilityLabel={`Subscribe to ${plan.name}`}>
              {subscribe.isPending ? 'Processing...' : 'Subscribe'}
            </Button>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FEFFFE'},
  content: {padding: 16, paddingBottom: 32},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 28, fontWeight: '700', color: '#2D2D2D', marginBottom: 8, marginTop: 16},
  currentPlan: {
    backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16, marginBottom: 16,
  },
  currentLabel: {fontSize: 12, color: '#6B7280', marginBottom: 4},
  currentValue: {fontSize: 18, fontWeight: '700', color: '#5B5AF7'},
  toggle: {marginBottom: 20},
  planCard: {borderRadius: 20, backgroundColor: '#FFFFFF', marginBottom: 16},
  popularCard: {borderWidth: 2, borderColor: '#5B5AF7'},
  popularChip: {backgroundColor: '#5B5AF7', alignSelf: 'flex-start', marginBottom: 8},
  popularText: {color: '#FFFFFF', fontSize: 11, fontWeight: '600'},
  planName: {fontSize: 20, fontWeight: '700', color: '#2D2D2D', marginBottom: 4},
  planDesc: {fontSize: 14, color: '#6B7280', marginBottom: 12},
  priceRow: {flexDirection: 'row', alignItems: 'baseline', marginBottom: 16},
  price: {fontSize: 32, fontWeight: '800', color: '#2D2D2D'},
  priceLabel: {fontSize: 16, color: '#6B7280', marginLeft: 4},
  features: {marginBottom: 16},
  featureRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  checkmark: {color: '#10B981', fontSize: 16, marginRight: 8, fontWeight: '700'},
  featureText: {fontSize: 14, color: '#374151', flex: 1},
  planBtn: {borderColor: '#5B5AF7', borderRadius: 20},
  popularBtn: {backgroundColor: '#5B5AF7', borderRadius: 20},
});

export default SubscriptionScreen;
