import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button } from '../components/ui';
import { Colors, Radius, Shadows } from '../lib/design';
import { useAuth } from '../providers/AuthProvider';

const logo = require('../../assets/images/icon.png');

const SignInScreen: React.FC = () => {
  const {signInWithGoogle, signInWithApple} = useAuth();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);

  const handleGoogle = async () => {
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert('Sign-In Failed', e.message || 'Could not sign in with Google');
    } finally {
      setLoading(null);
    }
  };

  const handleApple = async () => {
    setLoading('apple');
    try {
      await signInWithApple();
    } catch (e: any) {
      Alert.alert('Sign-In Failed', e.message || 'Could not sign in with Apple');
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>AskIEP</Text>
          <Text style={styles.tagline}>AI-powered IEP support for parents</Text>
        </View>

        <View style={styles.buttons}>
          <Button
            mode="outlined"
            onPress={handleGoogle}
            disabled={loading !== null}
            style={styles.googleButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.googleLabel}
            icon={loading === 'google' ? undefined : 'google'}>
            {loading === 'google' ? (
              <ActivityIndicator color={Colors.text} size="small" />
            ) : (
              'Continue with Google'
            )}
          </Button>

          {Platform.OS === 'ios' && (
            <Button
              mode="contained"
              onPress={handleApple}
              disabled={loading !== null}
              style={styles.appleButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.appleLabel}
              icon={loading === 'apple' ? undefined : 'apple'}>
              {loading === 'apple' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                'Continue with Apple'
              )}
            </Button>
          )}
        </View>

        <Text style={styles.disclaimer}>
          By signing in, you agree to AskIEP's Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.section,
    padding: 32,
    ...Shadows.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.green,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
  },
  googleButton: {
    borderColor: Colors.border,
    borderRadius: Radius.button,
    borderWidth: 1,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderRadius: Radius.button,
  },
  buttonContent: {
    height: 52,
  },
  googleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  appleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disclaimer: {
    marginTop: 24,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default SignInScreen;
