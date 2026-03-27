/**
 * UI compatibility shim for react-native-paper Divider.
 */
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../lib/design';

interface DividerProps {
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({style}) => (
  <View style={[styles.divider, style]} />
);

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
});
