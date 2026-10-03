import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, dimensions } from '../theme';
import { LocationField } from './LocationField';
import { PrimaryButton } from './PrimaryButton';

export interface BookingCardProps {
  pickupLocation: string;
  dropLocation: string;
  onPickupPress?: () => void;
  onDropPress?: () => void;
  onSwapLocations?: () => void;
  onCtaPress: () => void;
  ctaTitle?: string;
  ctaLoading?: boolean;
  ctaDisabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  pickupLocation,
  dropLocation,
  onPickupPress,
  onDropPress,
  onSwapLocations,
  onCtaPress,
  ctaTitle = 'Choose Ride',
  ctaLoading = false,
  ctaDisabled = false,
  style,
}) => {
  return (
    <View style={[styles.card, style]} accessibilityLabel="Ride Booking Card">
      <View style={styles.inputsRow}>
        <View style={styles.routeConnector}>
          <View style={styles.pickupDot} />
          <View style={styles.dashedLine} />
          <View style={styles.dropSquare} />
        </View>

        <View style={styles.fieldsColumn}>
          <LocationField
            type="pickup"
            label="Pickup Location"
            value={pickupLocation}
            placeholder="Your current location"
            onPress={onPickupPress}
            rightIconName="locate-outline"
            style={styles.fieldItem}
          />
          <View style={styles.fieldDivider} />
          <LocationField
            type="drop"
            label="Drop Location"
            value={dropLocation}
            placeholder="Where to?"
            onPress={onDropPress}
            rightIconName="search-outline"
            style={styles.fieldItem}
          />
        </View>

        {onSwapLocations && (
          <TouchableOpacity
            style={styles.swapButton}
            onPress={onSwapLocations}
            accessibilityLabel="Swap pickup and drop locations"
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="swap-vertical" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <PrimaryButton
        title={ctaTitle}
        onPress={onCtaPress}
        loading={ctaLoading}
        disabled={ctaDisabled}
        style={styles.ctaButton}
        accessibilityLabel={ctaTitle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  routeConnector: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 16,
    height: 72,
    marginRight: spacing.xs,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.pickupMarker,
  },
  dashedLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },
  dropSquare: {
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: colors.dropMarker,
  },
  fieldsColumn: {
    flex: 1,
  },
  fieldItem: {
    marginVertical: 2,
  },
  fieldDivider: {
    height: spacing.xs,
  },
  swapButton: {
    width: dimensions.minTouchTarget,
    height: dimensions.minTouchTarget,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  ctaButton: {
    marginTop: spacing.xs,
  },
});
