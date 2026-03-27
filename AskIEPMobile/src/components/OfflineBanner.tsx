import * as Network from 'expo-network';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const state = await Network.getNetworkStateAsync();
      if (mounted) setIsOffline(!state.isConnected);
    };

    // Initial check
    check();

    // Poll every 5 seconds (expo-network doesn't have a listener API)
    const interval = setInterval(check, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
