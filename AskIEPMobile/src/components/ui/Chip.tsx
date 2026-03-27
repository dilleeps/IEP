/**
 * UI compatibility shim for react-native-paper Chip.
 */
import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors, Radius } from '../../lib/design';

interface ChipProps {
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}

export const Chip: React.FC<ChipProps> = ({
  selected = false,
  onPress,
  compact = false,
  style,
  textStyle,
  children,
  accessibilityLabel,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      style={[
        styles.chip,
        compact && styles.compact,
        selected && styles.selected,
        style,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={onPress ? {selected} : undefined}>
      <Text style={[styles.text, selected && styles.selectedText, textStyle]}>
        {children}
      </Text>
    </Container>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  compact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  selected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  text: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  selectedText: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
