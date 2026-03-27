import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../lib/design';

interface PlaceholderScreenProps {
  title: string;
  description?: string;
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({
  title,
  description,
}) => (
  <View style={styles.container} accessibilityRole="header">
    <Text style={styles.title}>{title}</Text>
    {description && <Text style={styles.description}>{description}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
