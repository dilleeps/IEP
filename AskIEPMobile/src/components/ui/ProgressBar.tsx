/**
 * UI compatibility shim for react-native-paper ProgressBar.
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radius } from '../../lib/design';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  style?: ViewStyle;
  accessibilityRole?: any;
  accessibilityLabel?: string;
  accessibilityValue?: {min: number; max: number; now: number};
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = Colors.primary,
  style,
  accessibilityRole,
  accessibilityLabel,
  accessibilityValue,
}) => {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View
      style={[styles.track, style]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibilityValue}>
      <View
        style={[
          styles.fill,
          {width: `${clampedProgress * 100}%`, backgroundColor: color},
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
