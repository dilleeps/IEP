import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Button, Divider } from '../components/ui';
import { AppConfig } from '../lib/app-config';
import { biometricService } from '../lib/biometric-service';
import { secureStore } from '../lib/secure-store';
import { useAuth } from '../providers/AuthProvider';

const BIOMETRIC_PREF_KEY = 'biometric_enabled';

const SettingsRow: React.FC<{
  label: string;
  comingSoon?: boolean;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  accessibilityLabel?: string;
}> = ({label, comingSoon = false, value = false, onToggle, accessibilityLabel}) => (
  <View style={styles.row} accessibilityRole="none">
    <Text style={styles.rowLabel}>{label}</Text>
    {comingSoon ? (
      <Text style={styles.comingSoon}>Coming soon</Text>
    ) : (
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={!onToggle}
        trackColor={{false: '#E5E7EB', true: '#A5B4FC'}}
        thumbColor={value ? '#5B5AF7' : '#9CA3AF'}
        accessibilityLabel={accessibilityLabel || label}
        accessibilityRole="switch"
      />
    )}
  </View>
);

const NavRow: React.FC<{label: string; onPress: () => void}> = ({label, onPress}) => (
  <View style={styles.row}>
    <Text
      style={[styles.rowLabel, styles.linkText]}
      onPress={onPress}
      accessibilityRole="link">
      {label}
    </Text>
    <Text style={styles.chevron}>&#8250;</Text>
  </View>
);

const SettingsScreen: React.FC = () => {
  const {user, signOut} = useAuth();
  const router = useRouter();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    const checkBiometrics = async () => {
      const bioType = await biometricService.getAvailableBiometryType();
      setBiometricAvailable(bioType !== null);
      const pref = await secureStore.getItem(BIOMETRIC_PREF_KEY);
      setBiometricEnabled(pref === 'true');
    };
    checkBiometrics();
  }, []);

  const handleBiometricToggle = useCallback(async (enabled: boolean) => {
    if (enabled) {
      const result = await biometricService.authenticate(
        'Verify your identity to enable biometric lock',
      );
      if (!result) return;
    }
    await secureStore.setItem(BIOMETRIC_PREF_KEY, enabled ? 'true' : 'false');
    setBiometricEnabled(enabled);
  }, []);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign Out', style: 'destructive', onPress: signOut},
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title} accessibilityRole="header">
        Settings
      </Text>

      {user && (
        <View style={styles.profile} accessibilityRole="summary">
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.role}>{user.role}</Text>
          {user.subscriptionPlan && (
            <Text style={styles.plan}>{user.subscriptionPlan} Plan</Text>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Features
        </Text>
        <NavRow
          label="Expert Consultation"
          onPress={() => router.push('/consultation')}
        />
        <Divider />
        <NavRow
          label="Subscription & Plans"
          onPress={() => router.push('/subscription')}
        />
        <Divider />
        <NavRow
          label="Educational Resources"
          onPress={() => router.push('/(tabs)/settings/resources')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Security
        </Text>
        {biometricAvailable ? (
          <SettingsRow
            label="Face ID / Touch ID"
            value={biometricEnabled}
            onToggle={handleBiometricToggle}
            accessibilityLabel="Toggle biometric authentication"
          />
        ) : (
          <SettingsRow label="Face ID / Touch ID" comingSoon />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Notifications
        </Text>
        <SettingsRow label="Push notifications" comingSoon />
        <Divider />
        <SettingsRow label="Email notifications" comingSoon />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          About
        </Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Version</Text>
          <Text style={styles.rowValue}>{AppConfig.version}</Text>
        </View>
        <Divider />
        <View style={styles.row}>
          <Text
            style={[styles.rowLabel, styles.linkText]}
            onPress={() => Linking.openURL(AppConfig.privacyPolicyUrl)}
            accessibilityRole="link">
            Privacy Policy
          </Text>
        </View>
        <Divider />
        <View style={styles.row}>
          <Text
            style={[styles.rowLabel, styles.linkText]}
            onPress={() => Linking.openURL(AppConfig.termsOfServiceUrl)}
            accessibilityRole="link">
            Terms of Service
          </Text>
        </View>
        <Divider />
        <View style={styles.row}>
          <Text
            style={[styles.rowLabel, styles.linkText]}
            onPress={() => Linking.openURL(`mailto:${AppConfig.supportEmail}`)}
            accessibilityRole="link">
            Contact Support
          </Text>
        </View>
      </View>

      <Button
        mode="outlined"
        onPress={handleSignOut}
        style={styles.signOutButton}
        labelStyle={{color: '#EF4444'}}
        accessibilityLabel="Sign out of your account">
        Sign Out
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FEFFFE'},
  scrollContent: {padding: 16, paddingBottom: 32},
  title: {fontSize: 28, fontWeight: '700', color: '#2D2D2D', marginBottom: 8, marginTop: 16},
  profile: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 24,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  email: {fontSize: 16, fontWeight: '600', color: '#2D2D2D'},
  role: {fontSize: 13, color: '#6B7280', marginTop: 4},
  plan: {fontSize: 13, color: '#5B5AF7', fontWeight: '500', marginTop: 4},
  section: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 4, marginBottom: 16,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', color: '#6B7280',
    paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
  },
  rowLabel: {fontSize: 16, color: '#2D2D2D'},
  comingSoon: {fontSize: 12, color: '#9CA3AF', fontStyle: 'italic'},
  rowValue: {fontSize: 14, color: '#6B7280'},
  linkText: {color: '#5B5AF7'},
  chevron: {fontSize: 20, color: '#9CA3AF'},
  signOutButton: {borderColor: '#EF4444', borderRadius: 20, marginTop: 8},
});

export default SettingsScreen;
