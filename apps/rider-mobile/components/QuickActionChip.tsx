import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, dimensions } from '../theme';

export interface QuickActionChipProps {
  label: string;
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  isActive?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const QuickActionChip: React.FC<QuickActionChipProps> = ({
  label,
  iconName,
  isActive = false,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        isActive && styles.chipActive,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ selected: isActive }}
    >
      {iconName && (
        <Ionicons
          name={iconName}
          size={16}
          color={isActive ? colors.surface : colors.primary}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.chipText,
          isActive && styles.chipTextActive,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    minHeight: dimensions.minTouchTarget,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  icon: {
    marginRight: spacing.xs + 2,
  },
  chipText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
});
