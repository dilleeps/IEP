/**
 * UI compatibility shim for react-native-paper Card.
 * Renders a rounded card with shadow.
 * Includes Card.Content sub-component.
 */
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows } from '../../lib/design';

interface CardProps {
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityRole?: any;
  onPress?: () => void;
  children?: React.ReactNode;
}

interface CardContentProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

const CardContent: React.FC<CardContentProps> = ({style, children}) => (
  <View style={[styles.content, style]}>{children}</View>
);

export const Card: React.FC<CardProps> & {Content: typeof CardContent} = ({
  style,
  accessibilityLabel,
  accessibilityRole,
  onPress,
  children,
}) => {
  const content = (
    <View
      style={[styles.card, style]}
      accessibilityLabel={!onPress ? accessibilityLabel : undefined}
      accessibilityRole={!onPress ? accessibilityRole : undefined}>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole || 'button'}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
};

Card.Content = CardContent;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    ...Shadows.md,
    marginVertical: 6,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
});
