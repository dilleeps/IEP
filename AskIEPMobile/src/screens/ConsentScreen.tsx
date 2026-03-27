import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button } from '../components/ui';
import { apiRequest } from '../lib/api-client';
import { API } from '../lib/api-config';

const CONSENT_VERSION = '1.0';
const CONSENT_TEXT = `Parent/Guardian Consent & Data Release Agreement

By using AskIEP, you consent to the following:

1. DATA COLLECTION: We collect and process information about your child's Individualized Education Program (IEP), including goals, services, accommodations, and related educational data that you provide.

2. PURPOSE: This data is used solely to help you understand, track, and advocate for your child's IEP rights and services.

3. AI PROCESSING: Your child's IEP data may be processed by AI systems to provide analysis, recommendations, and advocacy support. AI-generated content is for informational purposes and does not constitute legal or educational advice.

4. DATA STORAGE: All data is encrypted at rest and in transit. We comply with FERPA and COPPA requirements for protecting student educational records.

5. DATA SHARING: We do not sell or share your child's data with third parties. Data is only shared with service providers necessary to operate the platform.

6. DATA RETENTION: You may request deletion of all your data at any time by contacting support@askiep.com.

7. YOUR RIGHTS: You have the right to access, correct, or delete your child's data. You may withdraw consent at any time by discontinuing use and requesting data deletion.

By tapping "I Accept," you acknowledge that you have read and understood this agreement and consent to the collection and processing of your child's educational data as described above.`;

interface ConsentOverlayProps {
  onAccepted: () => void;
  onDeclined: () => void;
}

export const ConsentOverlay: React.FC<ConsentOverlayProps> = ({
  onAccepted,
  onDeclined,
}) => {
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await apiRequest(API.consent, {
        method: 'POST',
        body: JSON.stringify({
          consentType: 'parent_guardian',
          consentText: CONSENT_TEXT,
          consentVersion: CONSENT_VERSION,
        }),
      });
      onAccepted();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not submit consent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Consent',
      'Declining will sign you out. You must accept the consent agreement to use AskIEP.',
      [
        {text: 'Go Back', style: 'cancel'},
        {text: 'Decline & Sign Out', style: 'destructive', onPress: onDeclined},
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Parent Consent Agreement
      </Text>
      <Text style={styles.subtitle}>Please review and accept to continue</Text>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="text"
        accessibilityLabel="Consent agreement text">
        <Text style={styles.consentText}>{CONSENT_TEXT}</Text>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={handleAccept}
          disabled={submitting}
          style={styles.acceptButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.acceptLabel}
          accessibilityLabel="Accept consent agreement"
          accessibilityHint="Accepts the parent consent agreement and continues to the app">
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            'I Accept'
          )}
        </Button>

        <Button
          mode="text"
          onPress={handleDecline}
          disabled={submitting}
          style={styles.declineButton}
          labelStyle={{color: '#EF4444'}}
          accessibilityLabel="Decline consent agreement"
          accessibilityHint="Declines the agreement and signs you out">
          Decline
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  scrollArea: {
    flex: 1,
    backgroundColor: '#FEFFFE',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scrollContent: {
    padding: 16,
  },
  consentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  actions: {
    paddingTop: 16,
    paddingBottom: 32,
    gap: 8,
  },
  acceptButton: {
    borderRadius: 20,
  },
  buttonContent: {
    height: 52,
  },
  acceptLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declineButton: {
    borderRadius: 20,
  },
});

export default ConsentOverlay;
