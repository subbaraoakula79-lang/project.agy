// apps/rider-mobile/app/index.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, shadows, dimensions } from '../theme';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { AppHeader } from '../components/AppHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { MapPreviewCard } from '../components/MapPreviewCard';
import { BottomTabBar } from '../components/BottomTabBar';

type AuthStep = 'SPLASH' | 'ONBOARDING';
type RideStep =
  | 'BOOKING'
  | 'CONFIRM_RIDE'
  | 'SEARCHING'
  | 'DRIVER_ARRIVING'
  | 'RIDE_IN_PROGRESS'
  | 'RIDE_COMPLETED'
  | 'NO_DRIVER';

export default function RiderIndexScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Public/Auth sub-step when not authenticated
  const [authStep, setAuthStep] = useState<AuthStep>('SPLASH');

  // Authenticated Ride sub-step
  const [rideStep, setRideStep] = useState<RideStep>('BOOKING');

  // Selected Vehicle
  const [selectedVehicle, setSelectedVehicle] = useState<'BIKE' | 'AUTO' | 'CAB'>('BIKE');

  // Ratings for completed ride
  const [userRating, setUserRating] = useState<number>(5);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);

  // Auto transition from Splash to Onboarding after 2.5s if untouched
  useEffect(() => {
    if (!isAuthenticated && authStep === 'SPLASH') {
      const timer = setTimeout(() => {
        setAuthStep('ONBOARDING');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [authStep, isAuthenticated]);

  // Fare calculations and asset mapping based on selected vehicle
  const vehicleConfig = {
    BIKE: {
      name: 'Bike',
      fare: 45,
      fareRange: '₹ 45 - 50',
      eta: '5 min',
      icon: 'bicycle' as const,
      driverVehicle: 'Hero Splendor • AP 39 XX 1234',
      image: require('../assets/images/vehicles/bike.png'),
    },
    AUTO: {
      name: 'Auto',
      fare: 72,
      fareRange: '₹ 72 - 80',
      eta: '7 min',
      icon: 'navigate' as const,
      driverVehicle: 'Bajaj Compact RE • AP 39 Y 5678',
      image: require('../assets/images/vehicles/auto.png'),
    },
    CAB: {
      name: 'Cab',
      fare: 110,
      fareRange: '₹ 110 - 125',
      eta: '10 min',
      icon: 'car' as const,
      driverVehicle: 'Maruti Suzuki Dzire • AP 39 Z 9012',
      image: require('../assets/images/vehicles/cab.png'),
    },
  };

  const currentVehicle = vehicleConfig[selectedVehicle];

  // Actions for Booking Flow
  const handleProceedToConfirm = () => {
    setRideStep('CONFIRM_RIDE');
  };

  const handleConfirmBooking = () => {
    setRideStep('SEARCHING');

    // Automatically transition to DRIVER_ARRIVING after 2.5 seconds
    setTimeout(() => {
      setRideStep('DRIVER_ARRIVING');
    }, 2500);
  };

  const handleCancelRide = () => {
    setRideStep('BOOKING');
  };

  const handleDriverArrived = () => {
    setRideStep('RIDE_IN_PROGRESS');
  };

  const handleCompleteRide = () => {
    setRideStep('RIDE_COMPLETED');
    setRatingSubmitted(false);
  };

  const handleResetToBooking = () => {
    setRideStep('BOOKING');
  };

  const handleSos = () => {
    Alert.alert(
      '🚨 Emergency SOS Activated',
      'Location broadcasted to Andhra Pradesh Police (112) & 24/7 Safety Dispatch.'
    );
  };

  // ==========================================
  // UN-AUTHENTICATED FLOW (NO BottomTabBar!)
  // ==========================================
  if (!isAuthenticated) {
    if (authStep === 'SPLASH') {
      return (
        <View style={styles.splashContainer}>
          <ImageBackground
            source={require('../assets/images/city/kakinada.jpg')}
            style={styles.splashBgImage}
            resizeMode="cover"
          >
            <SafeAreaView style={styles.splashSafeOverlay}>
              {/* Top/Center Brand Box matching Reference Screen 1 */}
              <View style={styles.splashTop}>
                <View style={styles.splashCard}>
                  <BrandLogo size="medium" showTagline={true} />
                </View>
              </View>

              {/* Bottom City Tagline matching Reference Screen 1 */}
              <TouchableOpacity
                style={styles.splashBottom}
                onPress={() => setAuthStep('ONBOARDING')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Tap to enter YatraSeva"
              >
                <View style={styles.splashBottomScrim}>
                  <Text style={styles.splashSub}>Your trusted ride partner in</Text>
                  <Text style={styles.splashCity}>Kakinada</Text>
                  <View style={styles.waveAccent}>
                    <Ionicons name="water" size={18} color="#38BDF8" />
                  </View>
                  <Text style={styles.splashTapPrompt}>Tap anywhere to continue →</Text>
                </View>
              </TouchableOpacity>
            </SafeAreaView>
          </ImageBackground>
        </View>
      );
    }

    // ONBOARDING SCREEN (Screen 2 in Reference)
    return (
      <SafeAreaView style={styles.onboardingContainer}>
        {/* Top Skip Button */}
        <View style={styles.onboardingTopRow}>
          <TouchableOpacity
            onPress={() => router.push('/login')}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip to login"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Center Illustration Area matching Reference Screen 2 */}
        <View style={styles.illustrationArea}>
          <Image
            source={require('../assets/images/illustrations/ride-city.png')}
            style={styles.onboardingIllustrationImage}
            resizeMode="contain"
          />
        </View>

        {/* Text Section */}
        <View style={styles.onboardingTextSection}>
          <Text style={styles.onboardingHeading}>
            Ride Safe{'\n'}Reach On Time
          </Text>
          <Text style={styles.onboardingBody}>
            Book bikes, autos or cabs in seconds.{'\n'}Travel safely with verified drivers.
          </Text>

          {/* 3-Dot Pagination Indicator */}
          <View style={styles.paginationRow}>
            <View style={styles.activePill} />
            <View style={styles.inactiveDot} />
            <View style={styles.inactiveDot} />
          </View>
        </View>

        {/* Action Button & Link */}
        <View style={styles.onboardingBottomActions}>
          <PrimaryButton
            title="Get Started"
            onPress={() => router.push('/login')}
            style={styles.getStartedButton}
            accessibilityLabel="Get Started with mobile verification"
          />

          <TouchableOpacity
            onPress={() => router.push('/login')}
            style={styles.loginLinkButton}
            accessibilityRole="button"
            accessibilityLabel="Already have an account? Log In"
          >
            <Text style={styles.alreadyHaveText}>
              Already have an account? <Text style={styles.loginLinkBold}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================
  // AUTHENTICATED RIDER FLOW
  // ==========================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        {/* Screen 1: BOOKING (Home) */}
        {rideStep === 'BOOKING' && (
          <View style={styles.flexOne}>
            <AppHeader
              showLogo={true}
              showNotification={true}
              onNotificationPress={() =>
                Alert.alert('Notifications', 'You have no unread notifications.')
              }
            />

            <ScrollView
              contentContainerStyle={styles.bookingScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Pickup / Drop Booking Card matching Reference Screen 4 */}
              <View style={styles.locationCard}>
                {/* Pickup Row */}
                <View style={styles.locationRow}>
                  <View style={styles.greenDotIndicator} />
                  <View style={styles.locationTextColumn}>
                    <Text style={styles.locationLabel}>Pickup Location</Text>
                    <Text style={styles.locationValue}>Kakinada Railway Station</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.locationActionIcon}
                    accessibilityLabel="Use current GPS location"
                  >
                    <Ionicons name="locate" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Divider Line */}
                <View style={styles.locationDivider} />

                {/* Drop Row */}
                <View style={styles.locationRow}>
                  <View style={styles.redDotIndicator} />
                  <View style={styles.locationTextColumn}>
                    <Text style={styles.locationLabel}>Drop Location</Text>
                    <Text style={styles.locationValue}>Rama Rao Peta, Kakinada</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.locationActionIcon}
                    accessibilityLabel="Swap pickup and drop"
                  >
                    <Ionicons name="swap-vertical" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Map Preview Card */}
              <MapPreviewCard
                pickupName="Kakinada Railway Station"
                dropName="Rama Rao Peta"
                distanceText="1.2 km"
                durationText="5 min"
                height={210}
                style={styles.mapMargin}
              />

              {/* Choose Vehicle Section matching Reference Screen 4 */}
              <View style={styles.vehicleSection}>
                <Text style={styles.sectionHeading}>Choose Vehicle</Text>
                <View style={styles.vehicleCardsRow}>
                  {(['BIKE', 'AUTO', 'CAB'] as const).map((type) => {
                    const cfg = vehicleConfig[type];
                    const isSelected = selectedVehicle === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.vehicleCard,
                          isSelected && styles.vehicleCardActive,
                        ]}
                        onPress={() => setSelectedVehicle(type)}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={`${cfg.name}, ₹${cfg.fare}, ${cfg.eta}`}
                        accessibilityState={{ selected: isSelected }}
                      >
                        <View
                          style={[
                            styles.vehicleImageContainer,
                            isSelected && styles.vehicleImageContainerActive,
                          ]}
                        >
                          <Image
                            source={cfg.image}
                            style={[
                              styles.vehicleCardImage,
                              type === 'AUTO' && { transform: [{ scale: 1.15 }] },
                            ]}
                            resizeMode="contain"
                          />
                        </View>
                        <Text
                          style={[
                            styles.vehicleTitle,
                            isSelected && styles.vehicleTitleActive,
                          ]}
                        >
                          {cfg.name}
                        </Text>
                        <Text
                          style={[
                            styles.vehicleFareText,
                            isSelected && styles.vehicleFareTextActive,
                          ]}
                        >
                          ₹ {cfg.fare}
                        </Text>
                        <Text style={styles.vehicleEtaText}>{cfg.eta}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Estimated Fare & View Details Bar */}
              <View style={styles.fareSummaryBar}>
                <View style={styles.fareLeft}>
                  <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
                  <Text style={styles.estimatedFareLabel}>Estimated Fare</Text>
                  <Text style={styles.estimatedFareValue}>{currentVehicle.fareRange}</Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(
                      'Fare Details',
                      `Base fare: ₹30\nDistance (1.2 km): ₹15\nTaxes: included\nTotal: ${currentVehicle.fareRange}`
                    )
                  }
                >
                  <Text style={styles.viewDetailsLink}>View Details &gt;</Text>
                </TouchableOpacity>
              </View>

              {/* Primary Book Ride Button */}
              <PrimaryButton
                title="Book Ride"
                onPress={handleProceedToConfirm}
                style={styles.bookRideButton}
                accessibilityLabel={`Book ${currentVehicle.name} ride`}
              />
            </ScrollView>

            <BottomTabBar activeTab="home" />
          </View>
        )}

        {/* Screen 2: CONFIRM RIDE (Screen 6 in Reference) */}
        {rideStep === 'CONFIRM_RIDE' && (
          <View style={styles.flexOne}>
            <AppHeader
              title="Confirm Ride"
              showBack={true}
              onBack={() => setRideStep('BOOKING')}
            />

            <View style={styles.confirmMapContainer}>
              <MapPreviewCard
                pickupName="Kakinada Railway Station"
                dropName="Rama Rao Peta"
                height={260}
              />
            </View>

            {/* Bottom White Sheet */}
            <View style={styles.bottomSheetCard}>
              {/* Selected Vehicle Row */}
              <View style={styles.sheetVehicleRow}>
                <View style={styles.sheetVehicleImageContainer}>
                  <Image
                    source={currentVehicle.image}
                    style={styles.sheetVehicleImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.sheetVehicleMeta}>
                  <Text style={styles.sheetVehicleName}>{currentVehicle.name}</Text>
                  <Text style={styles.sheetVehicleEta}>{currentVehicle.eta}</Text>
                </View>
                <Text style={styles.sheetVehiclePrice}>{currentVehicle.fareRange}</Text>
              </View>

              <View style={styles.sheetDivider} />

              {/* Payment Method Row */}
              <TouchableOpacity
                style={styles.sheetOptionRow}
                onPress={() => Alert.alert('Payment Method', 'Cash Payment selected')}
                accessibilityRole="button"
              >
                <View style={styles.sheetOptionLeft}>
                  <Ionicons name="cash-outline" size={20} color={colors.success} />
                  <Text style={styles.sheetOptionText}>Cash Payment</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              <View style={styles.sheetDivider} />

              {/* Promo Code Row */}
              <TouchableOpacity
                style={styles.sheetOptionRow}
                onPress={() => Alert.alert('Promo Code', 'Promo code FIRST50 applied')}
                accessibilityRole="button"
              >
                <View style={styles.sheetOptionLeft}>
                  <Ionicons name="ticket-outline" size={20} color={colors.primary} />
                  <Text style={styles.sheetOptionText}>Apply Promo Code</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Big Green Confirm Booking Button */}
              <TouchableOpacity
                style={styles.confirmBookingButton}
                onPress={handleConfirmBooking}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Confirm Booking"
              >
                <Text style={styles.confirmBookingText}>Confirm Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Screen 3: FINDING DRIVER (Screen 7 in Reference) */}
        {rideStep === 'SEARCHING' && (
          <View style={styles.flexOne}>
            <AppHeader
              title="Finding Driver"
              showBack={true}
              onBack={handleCancelRide}
            />

            <View style={styles.confirmMapContainer}>
              <MapPreviewCard
                pickupName="Kakinada Railway Station"
                dropName="Rama Rao Peta"
                height={260}
              />
            </View>

            {/* Bottom White Sheet */}
            <View style={styles.bottomSheetCard}>
              <View style={styles.findingImageCircle}>
                <Image
                  source={currentVehicle.image}
                  style={styles.findingVehicleImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.findingTitle}>Finding a driver...</Text>
              <Text style={styles.findingSub}>
                We are looking for the nearest available driver
              </Text>

              {/* Status List */}
              <View style={styles.findingStatusList}>
                <View style={styles.findingStatusItem}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                  <View style={styles.findingStatusMeta}>
                    <Text style={styles.findingStatusLabel}>Nearby drivers</Text>
                    <Text style={styles.findingStatusValue}>Searching...</Text>
                  </View>
                </View>

                <View style={styles.findingStatusItem}>
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                  <View style={styles.findingStatusMeta}>
                    <Text style={styles.findingStatusLabel}>Estimated arrival</Text>
                    <Text style={styles.findingStatusValue}>2-5 minutes</Text>
                  </View>
                </View>

                <View style={styles.findingStatusItem}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
                  <View style={styles.findingStatusMeta}>
                    <Text style={styles.findingStatusLabel}>Safety check</Text>
                    <Text style={styles.findingStatusValue}>Driver verified</Text>
                  </View>
                </View>
              </View>

              {/* Dev Simulation Pill */}
              <TouchableOpacity
                style={styles.devSimButton}
                onPress={() => setRideStep('DRIVER_ARRIVING')}
              >
                <Text style={styles.devSimText}>⏩ Dev: Driver Found</Text>
              </TouchableOpacity>

              {/* Outlined Cancel Button */}
              <SecondaryButton
                title="Cancel Ride"
                variant="danger"
                onPress={handleCancelRide}
                style={styles.cancelRideBtn}
              />
            </View>
          </View>
        )}

        {/* Screen 4: DRIVER ARRIVING (Screen 8 in Reference) */}
        {rideStep === 'DRIVER_ARRIVING' && (
          <View style={styles.flexOne}>
            <AppHeader
              title="Driver Arriving"
              showBack={true}
              onBack={handleCancelRide}
            />

            <ScrollView contentContainerStyle={styles.driverScrollContent}>
              {/* Green Driver Status Card */}
              <View style={styles.greenStatusCard}>
                <View style={styles.driverAvatarSmall}>
                  <Ionicons name="person" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.greenStatusMeta}>
                  <Text style={styles.greenStatusTitle}>Driver Arriving</Text>
                  <Text style={styles.greenStatusSub}>2 min away</Text>
                </View>
                <TouchableOpacity
                  style={styles.callCircleWhite}
                  onPress={() => Alert.alert('Calling Driver', '+91 80000 00001')}
                  accessibilityLabel="Call driver"
                >
                  <Ionicons name="call" size={18} color={colors.success} />
                </TouchableOpacity>
              </View>

              {/* Map Preview */}
              <MapPreviewCard
                pickupName="Kakinada Railway Station"
                dropName="Rama Rao Peta"
                height={200}
                style={styles.mapMargin}
              />

              {/* Driver Details Card */}
              <View style={styles.driverDetailsCard}>
                <View style={styles.driverInfoRow}>
                  <View style={styles.driverAvatarMedium}>
                    <Ionicons name="person" size={28} color={colors.primary} />
                  </View>
                  <View style={styles.driverMetaColumn}>
                    <Text style={styles.driverNameText}>Ramesh Kumar</Text>
                    <Text style={styles.driverRatingText}>★ 4.8 (248 rides)</Text>
                    <Text style={styles.driverVehicleText}>{currentVehicle.driverVehicle}</Text>
                  </View>
                  <View style={styles.driverVehicleThumbContainer}>
                    <Image
                      source={currentVehicle.image}
                      style={styles.driverVehicleThumb}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                {/* Actions Row: Call, Chat, Share */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionCircleButton}
                    onPress={() => Alert.alert('Call', 'Dialing Ramesh Kumar...')}
                    accessibilityRole="button"
                    accessibilityLabel="Call driver"
                  >
                    <View style={styles.actionIconCircle}>
                      <Ionicons name="call-outline" size={20} color={colors.textPrimary} />
                    </View>
                    <Text style={styles.actionLabel}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionCircleButton}
                    onPress={() => Alert.alert('Chat', 'Chat with Ramesh Kumar')}
                    accessibilityRole="button"
                    accessibilityLabel="Chat with driver"
                  >
                    <View style={styles.actionIconCircle}>
                      <Ionicons name="chatbubble-outline" size={20} color={colors.textPrimary} />
                    </View>
                    <Text style={styles.actionLabel}>Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionCircleButton}
                    onPress={() => Alert.alert('Share Ride', 'Ride link copied to clipboard')}
                    accessibilityRole="button"
                    accessibilityLabel="Share ride details"
                  >
                    <View style={styles.actionIconCircle}>
                      <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
                    </View>
                    <Text style={styles.actionLabel}>Share</Text>
                  </TouchableOpacity>
                </View>

                {/* Green Share Promo Card */}
                <TouchableOpacity
                  style={styles.sharePromoCard}
                  onPress={() => Alert.alert('Share Live Location', 'Sharing location with emergency contacts.')}
                >
                  <View style={styles.sharePromoIconCircle}>
                    <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                  </View>
                  <View style={styles.sharePromoTextColumn}>
                    <Text style={styles.sharePromoTitle}>Share your ride</Text>
                    <Text style={styles.sharePromoSub}>
                      Share live location with friends & family
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Dev Simulation: Start Trip */}
                <TouchableOpacity
                  style={styles.devSimButton}
                  onPress={handleDriverArrived}
                >
                  <Text style={styles.devSimText}>⏩ Dev: Rider Picked Up (Start Trip)</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Screen 5: RIDE IN PROGRESS (Screen 9 in Reference) */}
        {rideStep === 'RIDE_IN_PROGRESS' && (
          <View style={styles.flexOne}>
            <AppHeader
              title="Ride in Progress"
              showBack={false}
            />

            <ScrollView contentContainerStyle={styles.driverScrollContent}>
              {/* Blue Ride Status Card */}
              <View style={styles.blueStatusCard}>
                <View style={styles.driverAvatarSmall}>
                  <Ionicons name="bicycle" size={22} color="#FFFFFF" />
                </View>
                <View style={styles.greenStatusMeta}>
                  <Text style={styles.greenStatusTitle}>Ride in Progress</Text>
                  <Text style={styles.greenStatusSub}>Driver is on the way</Text>
                </View>
                <TouchableOpacity
                  style={styles.callCircleWhite}
                  onPress={() => Alert.alert('Calling Driver', '+91 80000 00001')}
                >
                  <Ionicons name="call" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Map Preview */}
              <MapPreviewCard
                pickupName="Kakinada Railway Station"
                dropName="Rama Rao Peta"
                height={200}
                style={styles.mapMargin}
              />

              {/* ETA / Distance Stats Row */}
              <View style={styles.statsCardRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>ETA</Text>
                  <Text style={styles.statValue}>2 min</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>1.2 km</Text>
                </View>
              </View>

              {/* Driver Details Card */}
              <View style={styles.driverDetailsCard}>
                <View style={styles.driverInfoRow}>
                  <View style={styles.driverAvatarMedium}>
                    <Ionicons name="person" size={28} color={colors.primary} />
                  </View>
                  <View style={styles.driverMetaColumn}>
                    <Text style={styles.driverNameText}>Ramesh Kumar</Text>
                    <Text style={styles.driverRatingText}>★ 4.8 (248 rides)</Text>
                    <Text style={styles.driverVehicleText}>{currentVehicle.driverVehicle}</Text>
                  </View>
                  <View style={styles.driverVehicleThumbContainer}>
                    <Image
                      source={currentVehicle.image}
                      style={styles.driverVehicleThumb}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                {/* Actions: Call, Chat, Share */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionCircleButton}
                    onPress={() => Alert.alert('Call', 'Dialing driver...')}
                  >
                    <View style={styles.actionIconCircle}>
                      <Ionicons name="call-outline" size={20} color={colors.textPrimary} />
                    </View>
                    <Text style={styles.actionLabel}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionCircleButton}
                    onPress={() => Alert.alert('Chat', 'Opening chat...')}
                  >
                    <View style={styles.actionIconCircle}>
                      <Ionicons name="chatbubble-outline" size={20} color={colors.textPrimary} />
                    </View>
                    <Text style={styles.actionLabel}>Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionCircleButton}
                    onPress={() => Alert.alert('Share', 'Sharing ride link...')}
                  >
                    <View style={styles.actionIconCircle}>
                      <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
                    </View>
                    <Text style={styles.actionLabel}>Share</Text>
                  </TouchableOpacity>
                </View>

                {/* Prominent Red SOS Button */}
                <TouchableOpacity
                  style={styles.redSosButton}
                  onPress={handleSos}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Emergency SOS Button"
                >
                  <Ionicons name="shield" size={18} color={colors.danger} />
                  <Text style={styles.redSosText}>SOS</Text>
                </TouchableOpacity>

                {/* Dev Simulation: End Trip */}
                <TouchableOpacity
                  style={styles.devSimButton}
                  onPress={handleCompleteRide}
                >
                  <Text style={styles.devSimText}>⏩ Dev: Complete Trip</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <BottomTabBar activeTab="home" />
          </View>
        )}

        {/* Screen 6: RIDE COMPLETED (Screen 10 in Reference) */}
        {rideStep === 'RIDE_COMPLETED' && (
          <View style={styles.flexOne}>
            <ScrollView contentContainerStyle={styles.completedScrollContent}>
              {/* Green Header Banner */}
              <View style={styles.completedHeaderBanner}>
                <View style={styles.completedCheckCircle}>
                  <Ionicons name="checkmark" size={32} color={colors.success} />
                </View>
                <Text style={styles.completedTitle}>Ride Completed</Text>
                <Text style={styles.completedSub}>Thank you for riding with us!</Text>
              </View>

              {/* Total Fare Card */}
              <View style={styles.completedFareCard}>
                <View style={styles.fareRowCompleted}>
                  <View>
                    <Text style={styles.fareLabelCompleted}>Total Fare</Text>
                    <Text style={styles.fareAmountCompleted}>₹ 48</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Fare Breakdown', 'Base Fare: ₹30\nDistance: ₹15\nTaxes: ₹3\nTotal: ₹48')}
                  >
                    <Text style={styles.viewDetailsLink}>View Details &gt;</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.sheetDivider} />

                {/* Cash Payment Row */}
                <View style={styles.paymentCompletedRow}>
                  <View style={styles.paymentLeftCompleted}>
                    <Ionicons name="cash-outline" size={20} color={colors.textPrimary} />
                    <Text style={styles.paymentMethodCompleted}>Cash Payment</Text>
                  </View>
                  <View style={styles.paidChip}>
                    <Text style={styles.paidChipText}>Paid</Text>
                  </View>
                </View>

                <View style={styles.sheetDivider} />

                {/* Driver Info */}
                <View style={styles.driverCompletedRow}>
                  <View style={styles.driverAvatarSmallBlue}>
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.driverCompletedMeta}>
                    <Text style={styles.driverCompletedName}>Ramesh Kumar</Text>
                    <Text style={styles.driverCompletedRating}>★ 4.8 • 248 rides</Text>
                  </View>
                </View>

                <View style={styles.sheetDivider} />

                {/* Rating Section */}
                <View style={styles.ratingSection}>
                  <Text style={styles.howWasRideText}>How was your ride?</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setUserRating(star)}
                        accessibilityLabel={`Rate ${star} star`}
                      >
                        <Ionicons
                          name={star <= userRating ? 'star' : 'star-outline'}
                          size={32}
                          color={star <= userRating ? '#F59E0B' : colors.textMuted}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Submit Rating Button */}
                <PrimaryButton
                  title={ratingSubmitted ? 'Rating Submitted ✓' : 'Submit Rating'}
                  onPress={() => {
                    setRatingSubmitted(true);
                    Alert.alert('Thank you!', 'Your feedback helps keep Kakinada rides safe.');
                  }}
                  disabled={ratingSubmitted}
                  style={styles.submitRatingBtn}
                />

                {/* Book Another Ride */}
                <SecondaryButton
                  title="Book Another Ride"
                  onPress={handleResetToBooking}
                  style={styles.bookAnotherBtn}
                />
              </View>
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },

  // SPLASH SCREEN STYLES
  splashContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  splashBgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  splashSafeOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  splashTop: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 44 : 20,
  },
  splashCard: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: borderRadius.lg,
    ...shadows.elevated,
  },
  splashBottom: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  splashBottomScrim: {
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  splashSub: {
    fontSize: fontSizes.md,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  splashCity: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  waveAccent: {
    marginTop: 4,
  },
  splashTapPrompt: {
    fontSize: fontSizes.xs,
    color: '#38BDF8',
    marginTop: spacing.md,
    fontWeight: '600',
  },

  // ONBOARDING SCREEN STYLES
  onboardingContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  onboardingTopRow: {
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  skipText: {
    fontSize: fontSizes.md,
    color: colors.primary,
    fontWeight: '600',
  },
  illustrationArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  onboardingIllustrationImage: {
    width: '100%',
    height: 220,
    maxHeight: 250,
  },
  onboardingTextSection: {
    alignItems: 'center',
  },
  onboardingHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: spacing.sm,
  },
  onboardingBody: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activePill: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  onboardingBottomActions: {
    marginBottom: spacing.lg,
  },
  getStartedButton: {
    height: dimensions.buttonHeight,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  loginLinkButton: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  alreadyHaveText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  loginLinkBold: {
    color: colors.primary,
    fontWeight: '700',
  },

  // BOOKING (HOME) STYLES
  bookingScrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDotIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },
  redDotIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    marginRight: spacing.sm,
  },
  locationTextColumn: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  locationValue: {
    fontSize: fontSizes.sm + 1,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: 1,
  },
  locationActionIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
    marginLeft: 20,
  },
  mapMargin: {
    marginBottom: spacing.md,
  },
  vehicleSection: {
    marginBottom: spacing.md,
  },
  sectionHeading: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  vehicleCardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 126,
    ...shadows.card,
  },
  vehicleCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  vehicleImageContainer: {
    width: '100%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  vehicleImageContainerActive: {
    transform: [{ scale: 1.05 }],
  },
  vehicleCardImage: {
    width: '100%',
    height: '100%',
  },
  vehicleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  vehicleTitleActive: {
    color: colors.textPrimary,
  },
  vehicleFareText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 1,
  },
  vehicleFareTextActive: {
    color: colors.primary,
  },
  vehicleEtaText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  fareSummaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  fareLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  estimatedFareLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  estimatedFareValue: {
    fontSize: fontSizes.sm,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  viewDetailsLink: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  bookRideButton: {
    height: dimensions.buttonHeight,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },

  // CONFIRM RIDE & BOTTOM SHEET STYLES
  confirmMapContainer: {
    flex: 1,
  },
  bottomSheetCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    ...shadows.elevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sheetVehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetVehicleImageContainer: {
    width: 64,
    height: 46,
    borderRadius: borderRadius.sm,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
  },
  sheetVehicleImage: {
    width: '90%',
    height: '90%',
  },
  sheetVehicleMeta: {
    flex: 1,
  },
  sheetVehicleName: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sheetVehicleEta: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  sheetVehiclePrice: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  sheetOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sheetOptionText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confirmBookingButton: {
    height: dimensions.buttonHeight,
    borderRadius: borderRadius.md,
    backgroundColor: colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    ...shadows.button,
  },
  confirmBookingText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // FINDING DRIVER STYLES
  findingImageCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.sm,
    padding: 6,
    ...shadows.card,
  },
  findingVehicleImage: {
    width: '85%',
    height: '85%',
  },
  findingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  findingSub: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.md,
  },
  findingStatusList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  findingStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  findingStatusMeta: {
    flex: 1,
  },
  findingStatusLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  findingStatusValue: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  devSimButton: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginVertical: spacing.xs,
  },
  devSimText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  cancelRideBtn: {
    marginTop: spacing.xs,
  },

  // DRIVER ARRIVING & IN PROGRESS STYLES
  driverScrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  greenStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successDark,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  blueStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  driverAvatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  greenStatusMeta: {
    flex: 1,
  },
  greenStatusTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  greenStatusSub: {
    fontSize: fontSizes.xs,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  callCircleWhite: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverDetailsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  driverAvatarMedium: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  driverMetaColumn: {
    flex: 1,
  },
  driverNameText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  driverRatingText: {
    fontSize: fontSizes.xs,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 1,
  },
  driverVehicleText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  driverVehicleThumbContainer: {
    width: 54,
    height: 38,
    borderRadius: borderRadius.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
  },
  driverVehicleThumb: {
    width: '90%',
    height: '90%',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.sm,
  },
  actionCircleButton: {
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sharePromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  sharePromoIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharePromoTextColumn: {
    flex: 1,
  },
  sharePromoTitle: {
    fontSize: fontSizes.xs + 1,
    fontWeight: '700',
    color: '#166534',
  },
  sharePromoSub: {
    fontSize: 10,
    color: '#15803D',
  },
  statsCardRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  redSosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.danger,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  redSosText: {
    fontSize: fontSizes.md,
    fontWeight: '800',
    color: colors.danger,
  },

  // RIDE COMPLETED STYLES
  completedScrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  completedHeaderBanner: {
    backgroundColor: colors.successDark,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  completedCheckCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  completedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  completedSub: {
    fontSize: fontSizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  completedFareCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  fareRowCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fareLabelCompleted: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  fareAmountCompleted: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  paymentCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLeftCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paymentMethodCompleted: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  paidChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  paidChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  driverCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatarSmallBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  driverCompletedMeta: {
    flex: 1,
  },
  driverCompletedName: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  driverCompletedRating: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  ratingSection: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  howWasRideText: {
    fontSize: fontSizes.sm + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  submitRatingBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
  },
  bookAnotherBtn: {
    marginTop: spacing.sm,
  },
});
