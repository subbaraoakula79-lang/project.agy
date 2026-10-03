import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, shadows, dimensions } from '../theme';
import { StatusChip } from './StatusChip';

export interface RideCardProps {
  id: string;
  date: string;
  pickup: string;
  destination: string;
  vehicleType?: string;
  fare: number;
  status: string;
  driverName?: string;
  driverRating?: number;
  onPress?: () => void;
  onRatePress?: () => void;
  ratedStars?: number;
  style?: StyleProp<ViewStyle>;
}

export const RideCard: React.FC<RideCardProps> = ({
  date,
  pickup,
  destination,
  vehicleType = 'Auto Rickshaw',
  fare,
  status,
  driverName,
  driverRating,
  onPress,
  onRatePress,
  ratedStars,
  style,
}) => {
  const isCompleted = status === 'COMPLETED' || status === 'RIDE_COMPLETED';

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Ride ${status}. Pickup: ${pickup}. Drop: ${destination}. Fare: ₹${fare}.`}
    >
      {/* Header: Vehicle & Fare & Status */}
      <View style={styles.headerRow}>
        <View style={styles.vehicleInfo}>
          <View style={styles.vehicleThumbBox}>
            <Image
              source={
                vehicleType.toLowerCase().includes('bike')
                  ? require('../assets/images/vehicles/bike.png')
                  : vehicleType.toLowerCase().includes('cab') || vehicleType.toLowerCase().includes('car')
                  ? require('../assets/images/vehicles/cab.png')
                  : require('../assets/images/vehicles/auto.png')
              }
              style={styles.vehicleThumbImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.vehicleText}>{vehicleType}</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.fareText}>₹{fare}</Text>
        </View>

        <StatusChip status={status} />
      </View>

      {/* Date */}
      <Text style={styles.dateText}>{date}</Text>

      {/* Route: Pickup -> Destination */}
      <View style={styles.routeContainer}>
        <View style={styles.indicatorCol}>
          <View style={styles.pickupDot} />
          <View style={styles.routeLine} />
          <View style={styles.dropSquare} />
        </View>

        <View style={styles.addressesCol}>
          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>Pickup</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {pickup}
            </Text>
          </View>
          <View style={styles.addressRow}>
            <Text style={styles.addressLabel}>Drop</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {destination}
            </Text>
          </View>
        </View>
      </View>

      {/* Driver info if available */}
      {driverName ? (
        <View style={styles.driverRow}>
          <View style={styles.driverLeft}>
            <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.driverText}>
              Captain: {driverName}
            </Text>
            {driverRating ? (
              <Text style={styles.driverRatingText}>★ {driverRating}</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Rating section if completed */}
      {isCompleted && (
        <View style={styles.ratingSection}>
          {ratedStars ? (
            <View style={styles.ratedBadge}>
              <Text style={styles.ratedBadgeText}>
                Rated Captain: {'★'.repeat(ratedStars)} ({ratedStars}/5)
              </Text>
            </View>
          ) : onRatePress ? (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={onRatePress}
              accessibilityRole="button"
              accessibilityLabel="Rate Captain for this ride"
            >
              <Ionicons name="star-outline" size={16} color={colors.primary} />
              <Text style={styles.rateButtonText}>Rate Captain</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vehicleThumbBox: {
    width: 28,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  vehicleThumbImage: {
    width: '100%',
    height: '100%',
  },
  vehicleText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dotSeparator: {
    marginHorizontal: spacing.xs + 2,
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
  fareText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  dateText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  routeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  indicatorCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 14,
    paddingVertical: 4,
    marginRight: spacing.sm,
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pickupMarker,
  },
  routeLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.divider,
    marginVertical: 2,
  },
  dropSquare: {
    width: 7,
    height: 7,
    borderRadius: 1,
    backgroundColor: colors.dropMarker,
  },
  addressesCol: {
    flex: 1,
    gap: 6,
  },
  addressRow: {
    justifyContent: 'center',
  },
  addressLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  driverLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  driverText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  driverRatingText: {
    fontSize: fontSizes.xs,
    color: '#D97706',
    fontWeight: '700',
    marginLeft: 4,
  },
  ratingSection: {
    marginTop: spacing.sm,
  },
  ratedBadge: {
    backgroundColor: colors.successLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  ratedBadgeText: {
    fontSize: fontSizes.xs,
    color: colors.success,
    fontWeight: '600',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryLight,
    minHeight: dimensions.minTouchTarget,
  },
  rateButtonText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '700',
  },
});
