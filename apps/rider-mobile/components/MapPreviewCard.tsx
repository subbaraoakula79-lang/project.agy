import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, shadows, dimensions } from '../app/theme';

export interface MapPreviewCardProps {
  pickupName?: string;
  dropName?: string;
  distanceText?: string;
  durationText?: string;
  gpsActive?: boolean;
  gpsCoordinates?: { lat: number; lng: number } | null;
  onRecenterPress?: () => void;
  style?: StyleProp<ViewStyle>;
  height?: number;
}

export const MapPreviewCard: React.FC<MapPreviewCardProps> = ({
  pickupName = 'Kakinada Railway Station',
  dropName = 'Rama Rao Peta',
  distanceText = '5.35 km',
  durationText = '13 mins',
  gpsActive = true,
  gpsCoordinates,
  onRecenterPress,
  style,
  height = 190,
}) => {
  return (
    <View
      style={[styles.container, { height }, style]}
      accessibilityRole="image"
      accessibilityLabel={`Static map preview from ${pickupName} to ${dropName}, estimated ${distanceText}, ${durationText}`}
    >
      {/* Background Map Art - Roads & Coastlines */}
      <View style={styles.mapCanvas}>
        {/* Water body simulation on the east (Bay of Bengal / Kakinada Bay) */}
        <View style={styles.waterBody} />

        {/* Secondary roads / grid lines */}
        <View style={[styles.roadLine, styles.roadH1]} />
        <View style={[styles.roadLine, styles.roadH2]} />
        <View style={[styles.roadLine, styles.roadH3]} />
        <View style={[styles.roadLine, styles.roadV1]} />
        <View style={[styles.roadLine, styles.roadV2]} />
        <View style={[styles.roadLine, styles.roadV3]} />

        {/* Main Arterial Road (Curved/Angled Route) */}
        <View style={styles.mainHighway} />

        {/* Route Line connecting Pickup to Drop */}
        <View style={styles.routeTrace}>
          <View style={styles.routeSegment1} />
          <View style={styles.routeSegment2} />
        </View>

        {/* City Label */}
        <View style={styles.cityBadge}>
          <Text style={styles.cityText}>Kakinada City</Text>
        </View>

        {/* Coastal label */}
        <View style={styles.beachBadge}>
          <Text style={styles.beachText}>Kakinada Beach 🌊</Text>
        </View>

        {/* Pickup Pin */}
        <View style={styles.pickupPinContainer}>
          <View style={styles.pinBubble}>
            <Text style={styles.pinText} numberOfLines={1}>
              {pickupName}
            </Text>
          </View>
          <View style={styles.pickupMarkerDot}>
            <View style={styles.innerDot} />
          </View>
        </View>

        {/* Moving Vehicle / Current indicator */}
        <View style={styles.vehiclePosition}>
          <View style={styles.vehicleCircle}>
            <Ionicons name="car" size={13} color={colors.surface} />
          </View>
          <View style={styles.vehiclePulse} />
        </View>

        {/* Drop Pin */}
        <View style={styles.dropPinContainer}>
          <View style={[styles.pinBubble, styles.dropBubble]}>
            <Text style={styles.pinText} numberOfLines={1}>
              {dropName}
            </Text>
          </View>
          <View style={styles.dropMarkerDot}>
            <View style={styles.innerSquare} />
          </View>
        </View>
      </View>

      {/* Floating Recenter / Locate Button */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={onRecenterPress}
        accessibilityLabel="Recenter map view"
        accessibilityRole="button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="locate" size={20} color={colors.primary} />
      </TouchableOpacity>

      {/* Bottom Info Ribbon */}
      <View style={styles.infoRibbon}>
        <View style={styles.ribbonLeft}>
          <Ionicons name="navigate-outline" size={14} color={colors.primary} />
          <Text style={styles.ribbonText}>
            ~{distanceText} • {durationText} est.
          </Text>
        </View>
        <View style={styles.ribbonRight}>
          <View
            style={[
              styles.gpsDot,
              { backgroundColor: gpsActive ? colors.success : colors.warning },
            ]}
          />
          <Text style={styles.gpsText}>
            {gpsActive
              ? gpsCoordinates
                ? `GPS (${gpsCoordinates.lat.toFixed(3)}, ${gpsCoordinates.lng.toFixed(3)})`
                : 'GPS Active'
              : 'GPS Pending'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#E8F1F5',
    ...shadows.card,
    position: 'relative',
  },
  mapCanvas: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#EDF3F7',
    overflow: 'hidden',
  },
  waterBody: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '32%',
    backgroundColor: '#C8E3F5',
    borderLeftWidth: 2,
    borderLeftColor: '#A8D2EB',
  },
  roadLine: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderColor: '#D7E3EC',
  },
  roadH1: {
    left: 0,
    right: '32%',
    top: 35,
    height: 7,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  roadH2: {
    left: 0,
    right: '32%',
    top: 85,
    height: 9,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  roadH3: {
    left: 0,
    right: '32%',
    top: 135,
    height: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  roadV1: {
    top: 0,
    bottom: 0,
    left: 45,
    width: 7,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  roadV2: {
    top: 0,
    bottom: 0,
    left: 140,
    width: 9,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  roadV3: {
    top: 0,
    bottom: 0,
    left: 220,
    width: 6,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  mainHighway: {
    position: 'absolute',
    left: 20,
    top: 20,
    width: 220,
    height: 120,
    borderColor: '#FFE494',
    borderWidth: 5,
    borderRadius: 60,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  routeTrace: {
    position: 'absolute',
    left: 45,
    top: 40,
    width: 170,
    height: 80,
  },
  routeSegment1: {
    position: 'absolute',
    left: 10,
    top: 15,
    width: 80,
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    transform: [{ rotate: '25deg' }],
  },
  routeSegment2: {
    position: 'absolute',
    left: 80,
    top: 35,
    width: 80,
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
    transform: [{ rotate: '38deg' }],
  },
  cityBadge: {
    position: 'absolute',
    top: 10,
    left: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cityText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  beachBadge: {
    position: 'absolute',
    top: 25,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  beachText: {
    fontSize: 9,
    color: '#0D5C99',
    fontWeight: '600',
  },
  pickupPinContainer: {
    position: 'absolute',
    left: 20,
    top: 28,
    alignItems: 'center',
  },
  dropPinContainer: {
    position: 'absolute',
    right: '34%',
    bottom: 40,
    alignItems: 'center',
  },
  pinBubble: {
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    maxWidth: 110,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  dropBubble: {
    borderColor: '#FED7D7',
  },
  pinText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pickupMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.pickupMarker,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  innerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.surface,
  },
  dropMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: colors.dropMarker,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  innerSquare: {
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: colors.surface,
  },
  vehiclePosition: {
    position: 'absolute',
    left: 110,
    top: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    zIndex: 2,
  },
  vehiclePulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30, 144, 255, 0.25)',
    zIndex: 1,
  },
  recenterButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: dimensions.minTouchTarget,
    height: dimensions.minTouchTarget,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    zIndex: 10,
  },
  infoRibbon: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  ribbonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ribbonText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ribbonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gpsText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
