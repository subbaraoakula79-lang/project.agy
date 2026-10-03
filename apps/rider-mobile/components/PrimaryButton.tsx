import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, shadows, borderRadius, dimensions } from '../theme';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'success' | 'danger';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  iconName,
  iconPosition = 'left',
  variant = 'primary',
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return colors.border;
    switch (variant) {
      case 'success':
        return colors.success;
      case 'danger':
        return colors.danger;
      default:
        return colors.primary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {iconName && iconPosition === 'left' && (
            <Ionicons name={iconName} size={18} color={disabled ? colors.textMuted : colors.surface} style={styles.leftIcon} />
          )}
          <Text style={[styles.text, disabled && styles.disabledText, textStyle]}>
            {title}
          </Text>
          {iconName && iconPosition === 'right' && (
            <Ionicons name={iconName} size={18} color={disabled ? colors.textMuted : colors.surface} style={styles.rightIcon} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: dimensions.buttonHeight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
  },
  disabledButton: {
    elevation: 0,
    shadowOpacity: 0,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.surface,
    fontSize: fontSizes.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabledText: {
    color: colors.textMuted,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
});
