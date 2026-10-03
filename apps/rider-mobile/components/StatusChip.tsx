import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, fontSizes, borderRadius } from '../theme';

export interface StatusChipProps {
  status: string;
  variant?: 'auto' | 'success' | 'warning' | 'danger' | 'info';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  status,
  variant = 'auto',
  style,
  textStyle,
}) => {
  const getColors = () => {
    if (variant !== 'auto') {
      switch (variant) {
        case 'success':
          return { bg: colors.successLight, text: colors.success };
        case 'danger':
          return { bg: colors.dangerLight, text: colors.danger };
        case 'warning':
          return { bg: colors.warningLight, text: '#B45309' };
        case 'info':
          return { bg: colors.primaryLight, text: colors.primaryDark };
      }
    }

    const upper = status.toUpperCase();
    if (upper === 'COMPLETED' || upper === 'RIDE_COMPLETED' || upper === 'PAID') {
      return { bg: colors.successLight, text: colors.success };
    }
    if (upper.startsWith('CANCEL') || upper === 'PAYMENT_FAILED') {
      return { bg: colors.dangerLight, text: colors.danger };
    }
    if (upper.includes('SEARCH') || upper.includes('PENDING')) {
      return { bg: colors.warningLight, text: '#B45309' };
    }
    // Ongoing, arriving, assigned
    return { bg: colors.primaryLight, text: colors.primaryDark };
  };

  const { bg, text } = getColors();

  const formatStatus = (s: string) => {
    return s
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <View
      style={[styles.container, { backgroundColor: bg }, style]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${formatStatus(status)}`}
    >
      <Text style={[styles.text, { color: text }, textStyle]}>
        {formatStatus(status)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
