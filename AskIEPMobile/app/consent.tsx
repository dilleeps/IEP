import { useRouter } from 'expo-router';
import React from 'react';
import { useAuth } from '../src/providers/AuthProvider';
import { ConsentOverlay } from '../src/screens/ConsentScreen';

export default function ConsentRoute() {
  const router = useRouter();
  const {signOut} = useAuth();

  return (
    <ConsentOverlay
      onAccepted={() => router.replace('/(tabs)')}
      onDeclined={signOut}
    />
  );
}
