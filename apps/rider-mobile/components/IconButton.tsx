import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, dimensions } from '../theme';

export interface IconButtonProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
  backgroundColor?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  name,
  size = 22,
  color = colors.textPrimary,
  backgroundColor = 'transparent',
  onPress,
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        { backgroundColor },
        disabled && styles.disabled,
        style,
      ]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Ionicons name={name} size={size} color={disabled ? colors.textMuted : color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minWidth: dimensions.minTouchTarget,
    minHeight: dimensions.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    padding: spacing.xs,
  },
  disabled: {
    opacity: 0.5,
  },
});
