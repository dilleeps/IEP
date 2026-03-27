import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { AuthProvider, useAuth } from '../src/providers/AuthProvider';
import { QueryProvider } from '../src/providers/QueryProvider';
import { ThemeProvider } from '../src/providers/ThemeProvider';

function AuthGate() {
  const {isAuthenticated, isLoading, user} = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup =
      segments[0] === 'sign-in' || segments[0] === 'consent' || segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (isAuthenticated && inAuthGroup && !user?.isNewUser) {
      router.replace('/(tabs)');
    } else if (isAuthenticated && !inAuthGroup && user?.isNewUser) {
      router.replace('/consent');
    }
  }, [isAuthenticated, isLoading, user, segments, router]);

  return null;
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <AuthGate />
            <OfflineBanner />
            <StatusBar style="auto" />
            <Stack screenOptions={{headerShown: false}}>
              <Stack.Screen name="sign-in" />
              <Stack.Screen name="consent" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="children" />
              <Stack.Screen name="goal-edit" options={{presentation: 'modal'}} />
              <Stack.Screen name="compliance-edit" options={{presentation: 'modal'}} />
              <Stack.Screen name="behavior-edit" options={{presentation: 'modal'}} />
              <Stack.Screen name="contact-edit" options={{presentation: 'modal'}} />
              <Stack.Screen name="consultation" />
              <Stack.Screen name="subscription" />
            </Stack>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
