import React, { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, View } from 'react-native';
import { biometricService, type BiometryType } from '../lib/biometric-service';
import { Colors } from '../lib/design';
import { secureStore } from '../lib/secure-store';
import { Button } from './ui/Button';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes (NFR12)

interface BiometricGateProps {
  children: React.ReactNode;
  onFallbackToSignIn: () => void;
}

export const BiometricGate: React.FC<BiometricGateProps> = ({
  children,
  onFallbackToSignIn,
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>(null);
  const [lastActive, setLastActive] = useState(Date.now());
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      const type = await biometricService.getAvailableBiometryType();
      setBiometryType(type);
      setChecking(false);
    };
    init();
  }, []);

  // Track app state for session timeout
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const elapsed = Date.now() - lastActive;
        if (elapsed > SESSION_TIMEOUT_MS && biometryType) {
          setIsLocked(true);
        }
      } else if (nextState === 'background') {
        setLastActive(Date.now());
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [lastActive, biometryType]);

  const handleBiometricUnlock = useCallback(async () => {
    const hasToken = await secureStore.getToken();
    if (!hasToken) {
      onFallbackToSignIn();
      return;
    }

    const success = await biometricService.authenticateWithRetry('Unlock AskIEP');
    if (success) {
      setIsLocked(false);
      setLastActive(Date.now());
    } else {
      // 3 failed attempts — fall back to full sign-in
      onFallbackToSignIn();
    }
  }, [onFallbackToSignIn]);

  if (checking) return null;
  if (!isLocked) return <>{children}</>;

  const biometricLabel =
    biometryType === 'FaceID'
      ? 'Face ID'
      : biometryType === 'TouchID'
      ? 'Touch ID'
      : 'Biometrics';

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title} accessibilityRole="header">
        AskIEP is Locked
      </Text>
      <Text style={styles.subtitle}>
        Use {biometricLabel} to unlock
      </Text>

      <Button
        mode="contained"
        onPress={handleBiometricUnlock}
        style={styles.button}>
        Unlock with {biometricLabel}
      </Button>

      <Button
        mode="text"
        onPress={onFallbackToSignIn}
        style={styles.fallbackButton}>
        Sign In Again
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  icon: {
    fontSize: 56,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    marginBottom: 12,
  },
  fallbackButton: {
    width: '100%',
  },
});
