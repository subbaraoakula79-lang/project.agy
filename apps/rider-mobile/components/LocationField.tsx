import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, dimensions } from '../app/theme';

export interface LocationFieldProps {
  type: 'pickup' | 'drop';
  label?: string;
  value: string;
  placeholder?: string;
  onPress?: () => void;
  rightIconName?: React.ComponentProps<typeof Ionicons>['name'];
  onRightIconPress?: () => void;
  loading?: boolean;
  error?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export const LocationField: React.FC<LocationFieldProps> = ({
  type,
  label,
  value,
  placeholder,
  onPress,
  rightIconName,
  onRightIconPress,
  loading = false,
  error,
  style,
  accessibilityLabel,
}) => {
  const isPickup = type === 'pickup';
  const defaultLabel = isPickup ? 'Pickup Location' : 'Drop Location';
  const displayLabel = label || defaultLabel;
  const markerColor = isPickup ? colors.pickupMarker : colors.dropMarker;
  const defaultPlaceholder = isPickup ? 'Your current location' : 'Where to?';

  return (
    <View style={[styles.wrapper, style]}>
      <TouchableOpacity
        style={[
          styles.container,
          error ? styles.errorBorder : null,
        ]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `${displayLabel}: ${value || placeholder || defaultPlaceholder}`}
      >
        <View style={styles.markerContainer}>
          <View
            style={[
              styles.markerDot,
              { backgroundColor: markerColor },
              !isPickup && styles.markerSquare,
            ]}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.labelText}>{displayLabel}</Text>
          <Text
            style={[
              styles.valueText,
              !value && styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {value || placeholder || defaultPlaceholder}
          </Text>
        </View>

        <View style={styles.actionContainer}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : rightIconName ? (
            <TouchableOpacity
              onPress={onRightIconPress || onPress}
              style={styles.iconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={`${displayLabel} action`}
              accessibilityRole="button"
            >
              <Ionicons
                name={rightIconName}
                size={20}
                color={isPickup ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: dimensions.inputHeight + 8,
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  markerContainer: {
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  markerSquare: {
    borderRadius: 2,
    width: 10,
    height: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  labelText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  valueText: {
    fontSize: fontSizes.sm + 1,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  placeholderText: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  actionContainer: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: dimensions.minTouchTarget,
    height: dimensions.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
});
