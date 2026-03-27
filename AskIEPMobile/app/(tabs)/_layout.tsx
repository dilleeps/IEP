import { HapticTab } from '@/components/haptic-tab';
import { Tabs, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import { BiometricGate } from '../../src/components/BiometricGate';

export default function TabLayout() {
  const router = useRouter();

  const handleFallbackToSignIn = useCallback(() => {
    router.replace('/sign-in');
  }, [router]);

  const Wrapper = ({children}: {children: React.ReactNode}) => (
    <BiometricGate onFallbackToSignIn={handleFallbackToSignIn}>
      {children}
    </BiometricGate>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#5B5AF7',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'IEP Documents',
          tabBarLabel: 'Documents',
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: 'Tracking',
          tabBarLabel: 'Tracking',
        }}
      />
      <Tabs.Screen
        name="letters"
        options={{
          title: 'Letters',
          tabBarLabel: 'Letters',
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: 'AI Chat',
          tabBarLabel: 'AI Chat',
        }}
      />
      <Tabs.Screen
        name="counselors"
        options={{
          title: 'Counselors',
          tabBarLabel: 'Counselors',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'More',
        }}
      />
      {/* Hide explore — legacy boilerplate */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
