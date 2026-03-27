/**
 * UI compatibility shim for react-native-paper TextInput.
 * Supports mode="outlined" (default) with floating label.
 */
import React from 'react';
import {
    TextInput as RNTextInput,
    TextInputProps as RNTextInputProps,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import { Colors, Radius } from '../../lib/design';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  mode?: 'outlined' | 'flat';
  style?: ViewStyle;
  error?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  mode = 'outlined',
  style,
  error = false,
  ...props
}) => (
  <View style={[styles.container, style]}>
    {label && <Text style={[styles.label, error && styles.labelError]}>{label}</Text>}
    <RNTextInput
      style={[styles.input, error && styles.inputError]}
      placeholderTextColor={Colors.textMuted}
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  labelError: {
    color: Colors.error,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.card,
  },
  inputError: {
    borderColor: Colors.error,
  },
});
