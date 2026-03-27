import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Radius } from '../lib/design';

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
}) => (
  <View style={styles.container} accessibilityRole="alert">
    <Text style={styles.icon}>⚠️</Text>
    <Text style={styles.message}>{message}</Text>
    {onRetry && (
      <TouchableOpacity
        style={styles.button}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Try again">
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  icon: {fontSize: 40, marginBottom: 16},
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
