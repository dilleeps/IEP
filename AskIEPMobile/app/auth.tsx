/**
 * Deep link callback — askiepmobile://auth?token=xxx&refreshToken=yyy
 *
 * The UI /mobile-auth page does the full Firebase sign-in, exchanges the token,
 * then redirects here with the final app JWTs as query params.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../src/providers/AuthProvider';

export default function AuthCallbackScreen() {
  const { token, refreshToken, error } = useLocalSearchParams<{
    token?: string;
    refreshToken?: string;
    error?: string;
  }>();
  const { handleMobileAuthCallback } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (error) {
      console.error('[AuthCallback] sign-in error:', decodeURIComponent(error as string));
      router.replace('/sign-in');
      return;
    }
    if (token && refreshToken) {
      handleMobileAuthCallback(
        decodeURIComponent(token as string),
        decodeURIComponent(refreshToken as string),
      )
        .then(() => router.replace('/(tabs)'))
        .catch(err => {
          console.error('[AuthCallback] failed:', err);
          router.replace('/sign-in');
        });
    }
  }, [token, refreshToken, error]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#5B5AF7" />
      <Text style={styles.text}>
        {error ? 'Sign-in failed. Returning…' : 'Completing sign in…'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: '#6B7280',
  },
});

