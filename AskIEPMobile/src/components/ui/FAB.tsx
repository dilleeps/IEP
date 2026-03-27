/**
 * UI compatibility shim for react-native-paper FAB (Floating Action Button).
 */
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Shadows } from '../../lib/design';

interface FABProps {
  icon: string;
  onPress: () => void;
  label?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
}

const iconMap: Record<string, string> = {
  add: 'add',
  upload: 'upload',
  send: 'send',
  edit: 'edit',
};

export const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  label,
  style,
  accessibilityLabel,
  disabled = false,
}) => {
  const iconName = (iconMap[icon] ?? 'add') as any;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.fab, label ? styles.extended : null, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <MaterialIcons name={iconName} size={24} color="#FFFFFF" />
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  extended: {
    width: 'auto',
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
