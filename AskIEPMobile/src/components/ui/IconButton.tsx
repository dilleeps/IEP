/**
 * UI compatibility shim for react-native-paper IconButton.
 * Renders a tappable icon using @expo/vector-icons MaterialIcons.
 */
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../../lib/design';

// Maps Paper icon names to MaterialIcons or Ionicons names
function resolveIcon(name: string): {set: 'material' | 'ion'; name: string} {
  const materialMap: Record<string, string> = {
    'delete-outline': 'delete-outline',
    delete: 'delete',
    send: 'send',
    stop: 'stop',
    add: 'add',
    edit: 'edit',
    close: 'close',
    bookmark: 'bookmark',
    'bookmark-outline': 'bookmark-border',
    'open-in-new': 'open-in-new',
    'chevron-right': 'chevron-right',
    'chevron-left': 'chevron-left',
    upload: 'upload',
    more: 'more-vert',
  };
  if (materialMap[name]) {
    return {set: 'material', name: materialMap[name]};
  }
  return {set: 'material', name: 'help-outline'};
}

interface IconButtonProps {
  icon: string;
  onPress?: () => void;
  size?: number;
  iconColor?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 24,
  iconColor = Colors.textSecondary,
  style,
  accessibilityLabel,
  disabled = false,
}) => {
  const resolved = resolveIcon(icon);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
      {resolved.set === 'material' ? (
        <MaterialIcons name={resolved.name as any} size={size} color={iconColor} />
      ) : (
        <Ionicons name={resolved.name as any} size={size} color={iconColor} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
