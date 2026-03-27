/**
 * UI compatibility shim for react-native-paper Button.
 * Supports modes: 'contained' | 'outlined' | 'text'
 * Supports icon names via @expo/vector-icons.
 */
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { Colors, Radius } from '../../lib/design';

// Maps Paper/Material icon names to expo/vector-icons
function renderIcon(name: string, color: string, size = 18) {
  const antDesignIcons: Record<string, string> = {
    google: 'google',
    apple: 'apple',
  };
  const materialIcons: Record<string, string> = {
    send: 'send',
    stop: 'stop',
    add: 'add',
    edit: 'edit',
    delete: 'delete',
    'delete-outline': 'delete-outline',
    bookmark: 'bookmark',
    'bookmark-outline': 'bookmark-outline',
    'open-in-new': 'open-in-new',
    upload: 'upload',
  };

  if (antDesignIcons[name]) {
    return <AntDesign name={antDesignIcons[name] as any} size={size} color={color} />;
  }
  if (materialIcons[name]) {
    return <MaterialIcons name={materialIcons[name] as any} size={size} color={color} />;
  }
  return null;
}

interface ButtonProps {
  mode?: 'contained' | 'outlined' | 'text';
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  labelStyle?: TextStyle;
  icon?: string;
  children?: React.ReactNode;
  accessibilityRole?: any;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  mode = 'text',
  onPress,
  disabled = false,
  loading = false,
  style,
  contentStyle,
  labelStyle,
  icon,
  children,
  accessibilityRole = 'button',
  accessibilityLabel,
}) => {
  const isContained = mode === 'contained';
  const isOutlined = mode === 'outlined';

  const containerStyle: ViewStyle = {
    ...(isContained && styles.contained),
    ...(isOutlined && styles.outlined),
    ...(mode === 'text' && styles.text),
    ...(disabled && styles.disabled),
  };

  const textColor = isContained ? '#FFFFFF' : Colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[containerStyle, style]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{disabled: disabled || loading}}>
      <View style={[styles.content, contentStyle]}>
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {icon && (
              <View style={styles.iconWrap}>
                {renderIcon(icon, textColor)}
              </View>
            )}
            <Text style={[styles.label, {color: textColor}, labelStyle]}>
              {children}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contained: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.button,
    paddingVertical: 2,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.button,
    backgroundColor: 'transparent',
    paddingVertical: 2,
  },
  text: {
    backgroundColor: 'transparent',
    paddingVertical: 2,
  },
  disabled: {
    opacity: 0.45,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  iconWrap: {
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
