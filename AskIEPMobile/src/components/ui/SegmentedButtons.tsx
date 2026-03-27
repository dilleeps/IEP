/**
 * UI compatibility shim for react-native-paper SegmentedButtons.
 * Renders a row of toggle buttons. Matches Paper's API.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors, Radius } from '../../lib/design';

interface SegmentButton {
  value: string;
  label: string;
  disabled?: boolean;
  accessibilityLabel?: string;
}

interface SegmentedButtonsProps {
  value: string;
  onValueChange: (value: string) => void;
  buttons: SegmentButton[];
  style?: ViewStyle;
}

export const SegmentedButtons: React.FC<SegmentedButtonsProps> = ({
  value,
  onValueChange,
  buttons,
  style,
}) => (
  <View style={[styles.container, style]}>
    {buttons.map((btn, index) => {
      const isSelected = btn.value === value;
      const isFirst = index === 0;
      const isLast = index === buttons.length - 1;

      return (
        <TouchableOpacity
          key={btn.value}
          onPress={() => !btn.disabled && onValueChange(btn.value)}
          disabled={btn.disabled}
          style={[
            styles.segment,
            isSelected && styles.segmentSelected,
            isFirst && styles.first,
            isLast && styles.last,
            btn.disabled && styles.segmentDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={btn.label}
          accessibilityState={{selected: isSelected, disabled: btn.disabled}}>
          <Text
            style={[
              styles.label,
              isSelected && styles.labelSelected,
            ]}>
            {btn.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radius.button,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  segmentSelected: {
    backgroundColor: Colors.primaryLight,
  },
  segmentDisabled: {
    opacity: 0.45,
  },
  first: {
    borderTopLeftRadius: Radius.button - 1,
    borderBottomLeftRadius: Radius.button - 1,
  },
  last: {
    borderTopRightRadius: Radius.button - 1,
    borderBottomRightRadius: Radius.button - 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  labelSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
