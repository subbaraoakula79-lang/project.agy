import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, shadows, dimensions } from './theme';
import { AppHeader } from '../components/AppHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { BookingCard } from '../components/BookingCard';
import { MapPreviewCard } from '../components/MapPreviewCard';
import { QuickActionChip } from '../components/QuickActionChip';
import { StatusChip } from '../components/StatusChip';
import { SectionHeader } from '../components/SectionHeader';
import { BottomTabBar } from '../components/BottomTabBar';

interface LocationItem {
  name: string;
  lat: number;
  lng: number;
}

const KAKINADA_LOCATIONS: LocationItem[] = [
  { name: 'Kakinada Railway Station', lat: 16.9558, lng: 82.2386 },
  { name: 'Jagannaickpur Main Road', lat: 16.9891, lng: 82.2475 },
  { name: 'Kakinada Beach Road', lat: 16.9330, lng: 82.2613 },
  { name: 'Sarpavaram Junction', lat: 16.9764, lng: 82.2402 },
  { name: 'Bhanugudi Junction', lat: 16.9910, lng: 82.2370 },
  { name: 'JNTU Kakinada Campus', lat: 16.9784, lng: 82.2350 },
  { name: 'Kakinada Bus Stand', lat: 16.9665, lng: 82.2425 },
];

export default function RiderAppScreen() {
  // Auth state
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'BOOKING' | 'SEARCHING' | 'ASSIGNED' | 'NO_DRIVER'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('+919000000001');
  const [otp, setOtp] = useState('123456');
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);

  // Device GPS State
  const [gpsPermission, setGpsPermission] = useState<'UNDETERMINED' | 'GRANTED' | 'DENIED'>('UNDETERMINED');
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const [locationFreshness, setLocationFreshness] = useState<'FRESH' | 'STALE' | 'UNAVAILABLE'>('FRESH');

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setGpsPermission('GRANTED');
          const pos = await Location.getCurrentPositionAsync({});
          setCurrentGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
          setLocationFreshness('FRESH');
        } else {
          setGpsPermission('DENIED');
        }
      } catch (err) {
        setGpsPermission('DENIED');
      }
    })();
  }, []);

  // Booking state
  const [pickup, setPickup] = useState<LocationItem>(KAKINADA_LOCATIONS[0]!);
  const [destination, setDestination] = useState<LocationItem>(KAKINADA_LOCATIONS[1]!);
  const [selectedVehicle, setSelectedVehicle] = useState<'BIKE' | 'AUTO' | 'CAB'>('AUTO');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');

  // Ride State
  const [currentRide, setCurrentRide] = useState<{
    id: string;
    status: string;
    vehicleType: string;
    pickupAddress: string;
    dropAddress: string;
    estimatedFare: number;
    paymentMethod: string;
    driver?: {
      name: string;
      phone: string;
      vehicleModel: string;
      regNumber: string;
    } | null;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('OTP');
    }, 400);
  };

  const handleVerifyOtp = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (otp === '123456') {
        setUser({ id: 'rider-001', name: 'Priya Sharma', role: 'RIDER' });
        setStep('BOOKING');
      } else {
        setError('Invalid OTP code. Use test code 123456');
      }
    }, 400);
  };

  const handleBookRide = (simulateNoDriver = false) => {
    setError('');
    setLoading(true);
    const fareMap = { BIKE: 76, AUTO: 108, CAB: 164 };
    const rideId = `ride-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newRide = {
      id: rideId,
      status: 'SEARCHING_DRIVER',
      vehicleType: selectedVehicle,
      pickupAddress: pickup.name,
      dropAddress: destination.name,
      estimatedFare: fareMap[selectedVehicle],
      paymentMethod,
      driver: null,
    };

    setCurrentRide(newRide);
    setStep('SEARCHING');
    setLoading(false);

    // Simulate driver matching transition
    setTimeout(() => {
      if (simulateNoDriver) {
        setCurrentRide((prev) => (prev ? { ...prev, status: 'CANCELLED_NO_DRIVER' } : null));
        setStep('NO_DRIVER');
      } else {
        setCurrentRide((prev) =>
          prev
            ? {
                ...prev,
                status: 'DRIVER_ASSIGNED',
                driver: {
                  name: 'Suresh Babu',
                  phone: '+918000000001',
                  vehicleModel:
                    selectedVehicle === 'BIKE'
                      ? 'Honda Activa 6G'
                      : selectedVehicle === 'AUTO'
                      ? 'Bajaj RE Compact'
                      : 'Maruti Swift Dzire',
                  regNumber:
                    selectedVehicle === 'BIKE'
                      ? 'AP05AB1234'
                      : selectedVehicle === 'AUTO'
                      ? 'AP05CD5678'
                      : 'AP05EF9012',
                },
              }
            : null,
        );
        setStep('ASSIGNED');
      }
    }, 1800);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentRide(null);
    setStep('PHONE');
    setOtp('123456');
  };

  const handleSwapLocations = () => {
    const temp = pickup;
    setPickup(destination);
    setDestination(temp);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <AppHeader
          title="YatraSeva"
          subtitle="Safe Rides • Better Tomorrow"
          showBack={step === 'OTP'}
          onBack={() => setStep('PHONE')}
          showNotification={Boolean(user)}
          showProfile={Boolean(user)}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* STEP 1: PHONE LOGIN */}
          {step === 'PHONE' && (
            <View style={styles.authContainer}>
              <View style={styles.authCard}>
                <View style={styles.authIconCircle}>
                  <Ionicons name="call-outline" size={28} color={colors.primary} />
                </View>
                <Text style={styles.authTitle}>Verify Your Mobile Number</Text>
                <Text style={styles.authSub}>We'll send you a 6 digit OTP to verify your account</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      value={phoneNumber.replace('+91', '')}
                      onChangeText={(val) => setPhoneNumber(`+91${val.replace(/\D/g, '')}`)}
                      placeholder="9000000001"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      maxLength={10}
                      accessibilityLabel="Enter 10-digit mobile number"
                    />
                  </View>
                </View>

                <PrimaryButton
                  title="Send OTP"
                  onPress={handleRequestOtp}
                  loading={loading}
                  style={styles.authButton}
                  accessibilityLabel="Send OTP verification code"
                />

                <Text style={styles.termsText}>
                  By continuing, you agree to our Terms of Service & Privacy Policy
                </Text>
              </View>
            </View>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 'OTP' && (
            <View style={styles.authContainer}>
              <View style={styles.authCard}>
                <View style={styles.authIconCircle}>
                  <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
                </View>
                <Text style={styles.authTitle}>Enter Verification Code</Text>
                <Text style={styles.authSub}>OTP sent to {phoneNumber}</Text>

                <View style={styles.devHintBox}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                  <Text style={styles.devHintText}>Development Test OTP: 123456</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>6-Digit OTP</Text>
                  <TextInput
                    style={styles.otpInput}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="123456"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                    accessibilityLabel="Enter 6-digit OTP code"
                  />
                </View>

                <PrimaryButton
                  title="Verify & Continue"
                  onPress={handleVerifyOtp}
                  loading={loading}
                  style={styles.authButton}
                  accessibilityLabel="Verify OTP and Login"
                />

                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={handleRequestOtp}
                  accessibilityRole="button"
                  accessibilityLabel="Resend OTP code"
                >
                  <Text style={styles.resendText}>Didn't receive code? Resend OTP</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: BOOKING SCREEN */}
          {step === 'BOOKING' && user && (
            <View style={styles.bookingContainer}>
              {/* Greeting Section */}
              <View style={styles.greetingSection}>
                <View>
                  <Text style={styles.greetingSub}>Hi, {user.name} 👋</Text>
                  <Text style={styles.greetingTitle}>Where are you going today?</Text>
                </View>
                <TouchableOpacity
                  style={styles.logoutPill}
                  onPress={handleLogout}
                  accessibilityRole="button"
                  accessibilityLabel="Log out of rider account"
                >
                  <Ionicons name="log-out-outline" size={14} color={colors.danger} />
                  <Text style={styles.logoutPillText}>Logout</Text>
                </TouchableOpacity>
              </View>

              {/* Booking Card */}
              <BookingCard
                pickupLocation={pickup.name}
                dropLocation={destination.name}
                onSwapLocations={handleSwapLocations}
                onCtaPress={() => handleBookRide(false)}
                ctaTitle={`Request ${selectedVehicle} Ride`}
                ctaLoading={loading}
                style={styles.cardSpacing}
              />

              {/* Map Preview Card */}
              <MapPreviewCard
                pickupName={pickup.name}
                dropName={destination.name}
                distanceText="5.35 km"
                durationText="13 mins"
                gpsActive={gpsPermission === 'GRANTED'}
                gpsCoordinates={currentGps}
                style={styles.cardSpacing}
              />

              {locationFreshness !== 'FRESH' && (
                <View style={styles.freshnessNotice}>
                  <Ionicons name="cloud-download-outline" size={14} color={colors.warning} />
                  <Text style={styles.freshnessNoticeText}>
                    Updating GPS telemetry... ({locationFreshness})
                  </Text>
                </View>
              )}

              {/* Quick Actions */}
              <SectionHeader title="Saved & Quick Places" />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
                contentContainerStyle={styles.chipsContainer}
              >
                <QuickActionChip
                  label="Railway Station"
                  iconName="train-outline"
                  onPress={() => setPickup(KAKINADA_LOCATIONS[0]!)}
                  isActive={pickup.name === KAKINADA_LOCATIONS[0]!.name}
                />
                <QuickActionChip
                  label="Work / JNTU"
                  iconName="briefcase-outline"
                  onPress={() => setDestination(KAKINADA_LOCATIONS[5]!)}
                  isActive={destination.name === KAKINADA_LOCATIONS[5]!.name}
                />
                <QuickActionChip
                  label="Beach Road"
                  iconName="water-outline"
                  onPress={() => setDestination(KAKINADA_LOCATIONS[2]!)}
                  isActive={destination.name === KAKINADA_LOCATIONS[2]!.name}
                />
                <QuickActionChip
                  label="Bhanugudi"
                  iconName="bookmark-outline"
                  onPress={() => setDestination(KAKINADA_LOCATIONS[4]!)}
                  isActive={destination.name === KAKINADA_LOCATIONS[4]!.name}
                />
              </ScrollView>

              {/* Vehicle Type Selector */}
              <SectionHeader title="Choose Vehicle" subtitle="Transparent Kakinada fares" />
              <View style={styles.vehicleGrid}>
                {(
                  [
                    { type: 'BIKE', name: 'Bike', fare: 76, eta: '3 min', icon: 'bicycle-outline' as const },
                    { type: 'AUTO', name: 'Auto', fare: 108, eta: '5 min', icon: 'navigate-outline' as const },
                    { type: 'CAB', name: 'Cab', fare: 164, eta: '8 min', icon: 'car-outline' as const },
                  ] as const
                ).map((v) => {
                  const isSelected = selectedVehicle === v.type;
                  return (
                    <TouchableOpacity
                      key={v.type}
                      style={[
                        styles.vehicleOptionCard,
                        isSelected && styles.vehicleOptionCardActive,
                      ]}
                      onPress={() => setSelectedVehicle(v.type)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`${v.name}, ₹${v.fare}, ETA ${v.eta}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={styles.vehicleIconCircle}>
                        <Ionicons
                          name={v.icon}
                          size={24}
                          color={isSelected ? colors.primary : colors.textPrimary}
                        />
                      </View>
                      <Text style={[styles.vehicleName, isSelected && styles.vehicleTextActive]}>
                        {v.name}
                      </Text>
                      <Text style={[styles.vehicleFare, isSelected && styles.vehicleFareActive]}>
                        ₹{v.fare}
                      </Text>
                      <Text style={styles.vehicleEta}>{v.eta}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Payment Method Selector */}
              <SectionHeader title="Payment Method" />
              <View style={styles.paymentRow}>
                {(['CASH', 'UPI'] as const).map((pm) => {
                  const isSelected = paymentMethod === pm;
                  return (
                    <TouchableOpacity
                      key={pm}
                      style={[
                        styles.paymentOptionCard,
                        isSelected && styles.paymentOptionCardActive,
                      ]}
                      onPress={() => setPaymentMethod(pm)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Pay via ${pm}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Ionicons
                        name={pm === 'CASH' ? 'cash-outline' : 'qr-code-outline'}
                        size={20}
                        color={isSelected ? colors.primary : colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.paymentName,
                          isSelected && styles.paymentNameActive,
                        ]}
                      >
                        {pm === 'CASH' ? 'Cash to Captain' : 'UPI / Online'}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 4: SEARCHING DRIVER */}
          {step === 'SEARCHING' && currentRide && (
            <View style={styles.searchingContainer}>
              <View style={styles.stateCard}>
                <View style={styles.stateIconCircle}>
                  <Ionicons name="search" size={28} color={colors.primary} />
                </View>
                <Text style={styles.stateTitle}>Finding Your Captain...</Text>
                <Text style={styles.stateSub}>Searching nearby verified captains in Kakinada</Text>

                <View style={styles.statusChipWrapper}>
                  <StatusChip status={currentRide.status} />
                </View>

                {/* Ride Summary Box */}
                <View style={styles.detailSummaryBox}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Vehicle</Text>
                    <Text style={styles.summaryValue}>{currentRide.vehicleType}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Estimated Fare</Text>
                    <Text style={styles.summaryValue}>₹{currentRide.estimatedFare}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Payment</Text>
                    <Text style={styles.summaryValue}>{currentRide.paymentMethod}</Text>
                  </View>
                </View>

                <SecondaryButton
                  title="Cancel Request"
                  variant="outline"
                  onPress={() => {
                    setCurrentRide(null);
                    setStep('BOOKING');
                  }}
                  style={styles.cancelBtn}
                />
              </View>

              <MapPreviewCard
                pickupName={currentRide.pickupAddress}
                dropName={currentRide.dropAddress}
                style={styles.cardSpacing}
              />
            </View>
          )}

          {/* STEP 5: ASSIGNED / IN PROGRESS / COMPLETED */}
          {step === 'ASSIGNED' && currentRide && (
            <View style={styles.assignedContainer}>
              <View style={styles.stateCard}>
                <View style={styles.assignedHeaderRow}>
                  <View>
                    <Text style={styles.tripStatusTitle}>
                      {currentRide.status === 'DRIVER_ASSIGNED' && 'Captain Assigned! 🚖'}
                      {currentRide.status === 'DRIVER_ARRIVING' && 'Captain On The Way 🚗'}
                      {currentRide.status === 'DRIVER_ARRIVED' && 'Captain Has Arrived 📍'}
                      {currentRide.status === 'RIDE_STARTED' && 'Trip In Progress 🛣️'}
                      {currentRide.status === 'RIDE_COMPLETED' && 'Arrived at Destination 🏁'}
                      {currentRide.status === 'PAYMENT_PENDING' && 'Payment Pending ⏳'}
                      {currentRide.status === 'COMPLETED' && 'Trip Completed & Settled 🎉'}
                      {currentRide.status === 'PAYMENT_FAILED' && 'Payment Failed ⚠️'}
                    </Text>
                    <Text style={styles.tripStatusSub}>Ride #{currentRide.id}</Text>
                  </View>
                  <StatusChip status={currentRide.status} />
                </View>

                {/* Driver Profile Card */}
                {currentRide.driver && (
                  <View style={styles.driverProfileBox}>
                    <View style={styles.driverAvatar}>
                      <Ionicons name="person" size={26} color={colors.primary} />
                    </View>
                    <View style={styles.driverMeta}>
                      <Text style={styles.driverName}>{currentRide.driver.name}</Text>
                      <Text style={styles.driverVehicle}>
                        {currentRide.driver.vehicleModel} • {currentRide.driver.regNumber}
                      </Text>
                    </View>
                    <View style={styles.driverActions}>
                      <TouchableOpacity
                        style={styles.driverActionBtn}
                        accessibilityLabel="Call Captain"
                        accessibilityRole="button"
                      >
                        <Ionicons name="call" size={18} color={colors.success} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.driverActionBtn}
                        accessibilityLabel="Message Captain"
                        accessibilityRole="button"
                      >
                        <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Locations Summary */}
                <View style={styles.detailSummaryBox}>
                  <View style={styles.locationSummaryRow}>
                    <View style={styles.pickupDotSmall} />
                    <Text style={styles.locationSummaryText} numberOfLines={1}>
                      {currentRide.pickupAddress}
                    </Text>
                  </View>
                  <View style={styles.locationDivider} />
                  <View style={styles.locationSummaryRow}>
                    <View style={styles.dropSquareSmall} />
                    <Text style={styles.locationSummaryText} numberOfLines={1}>
                      {currentRide.dropAddress}
                    </Text>
                  </View>
                </View>

                {/* Interactive Payment Actions */}
                {(currentRide.status === 'PAYMENT_PENDING' || currentRide.status === 'PAYMENT_FAILED') && (
                  <View style={styles.paymentActionsBox}>
                    <Text style={styles.paymentActionTitle}>
                      Total Fare: ₹{currentRide.estimatedFare} ({currentRide.paymentMethod})
                    </Text>
                    {currentRide.paymentMethod === 'CASH' ? (
                      <View style={styles.cashInstructions}>
                        <Text style={styles.cashText}>
                          💵 Please pay ₹{currentRide.estimatedFare} cash to Captain {currentRide.driver?.name}.
                        </Text>
                        <SecondaryButton
                          title="Switch to UPI Payment"
                          onPress={() => setCurrentRide((prev) => (prev ? { ...prev, paymentMethod: 'UPI' } : null))}
                          style={styles.switchMethodBtn}
                        />
                      </View>
                    ) : (
                      <View style={styles.upiActions}>
                        <PrimaryButton
                          title={`Pay ₹${currentRide.estimatedFare} via UPI`}
                          onPress={() => {
                            setLoading(true);
                            setTimeout(() => {
                              setLoading(false);
                              setCurrentRide((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null));
                            }, 1200);
                          }}
                          loading={loading}
                          variant="success"
                          style={styles.upiPayBtn}
                        />
                        <SecondaryButton
                          title="Simulate UPI Failure"
                          variant="danger"
                          onPress={() => setCurrentRide((prev) => (prev ? { ...prev, status: 'PAYMENT_FAILED' } : null))}
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* Ride Cancellation if allowed */}
                {(currentRide.status === 'DRIVER_ASSIGNED' || currentRide.status === 'DRIVER_ARRIVING') && (
                  <SecondaryButton
                    title="Cancel Ride"
                    variant="danger"
                    onPress={() => {
                      setCurrentRide((prev) => (prev ? { ...prev, status: 'CANCELLED_BY_RIDER' } : null));
                      setError('Ride cancelled by you.');
                      setTimeout(() => setStep('BOOKING'), 1200);
                    }}
                    style={styles.actionBtnMargin}
                  />
                )}

                {/* Dev Simulation Controls */}
                <View style={styles.devSimulationPanel}>
                  <Text style={styles.devSimTitle}>🧪 Dev Simulation: Advance State</Text>
                  <View style={styles.simButtonsRow}>
                    {currentRide.status === 'DRIVER_ASSIGNED' && (
                      <TouchableOpacity
                        style={styles.simPill}
                        onPress={() => setCurrentRide((prev) => (prev ? { ...prev, status: 'DRIVER_ARRIVING' } : null))}
                      >
                        <Text style={styles.simPillText}>Arriving ⏩</Text>
                      </TouchableOpacity>
                    )}
                    {currentRide.status === 'DRIVER_ARRIVING' && (
                      <TouchableOpacity
                        style={styles.simPill}
                        onPress={() => setCurrentRide((prev) => (prev ? { ...prev, status: 'DRIVER_ARRIVED' } : null))}
                      >
                        <Text style={styles.simPillText}>Arrived ⏩</Text>
                      </TouchableOpacity>
                    )}
                    {currentRide.status === 'DRIVER_ARRIVED' && (
                      <TouchableOpacity
                        style={styles.simPill}
                        onPress={() => setCurrentRide((prev) => (prev ? { ...prev, status: 'RIDE_STARTED' } : null))}
                      >
                        <Text style={styles.simPillText}>Start Trip ⏩</Text>
                      </TouchableOpacity>
                    )}
                    {currentRide.status === 'RIDE_STARTED' && (
                      <TouchableOpacity
                        style={styles.simPill}
                        onPress={() => setCurrentRide((prev) => (prev ? { ...prev, status: 'PAYMENT_PENDING' } : null))}
                      >
                        <Text style={styles.simPillText}>End Trip ⏩</Text>
                      </TouchableOpacity>
                    )}
                    {currentRide.status === 'PAYMENT_PENDING' && (
                      <TouchableOpacity
                        style={styles.simPill}
                        onPress={() => setCurrentRide((prev) => (prev ? { ...prev, status: 'COMPLETED' } : null))}
                      >
                        <Text style={styles.simPillText}>Confirm Cash (Captain) ⏩</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {currentRide.status === 'COMPLETED' && (
                  <PrimaryButton
                    title="Book Another Ride"
                    onPress={() => setStep('BOOKING')}
                    style={styles.actionBtnMargin}
                  />
                )}
              </View>

              <MapPreviewCard
                pickupName={currentRide.pickupAddress}
                dropName={currentRide.dropAddress}
                style={styles.cardSpacing}
              />
            </View>
          )}

          {/* STEP 6: NO DRIVER */}
          {step === 'NO_DRIVER' && currentRide && (
            <View style={styles.noDriverContainer}>
              <View style={styles.stateCard}>
                <View style={[styles.stateIconCircle, { backgroundColor: colors.dangerLight }]}>
                  <Ionicons name="car-outline" size={28} color={colors.danger} />
                </View>
                <Text style={styles.stateTitle}>No Captains Available</Text>
                <Text style={styles.stateSub}>
                  All captains in Kakinada are currently occupied. Please try again in a few moments.
                </Text>

                <View style={styles.statusChipWrapper}>
                  <StatusChip status="CANCELLED_NO_DRIVER" />
                </View>

                <PrimaryButton
                  title="Try Again"
                  onPress={() => setStep('BOOKING')}
                  style={styles.actionBtnMargin}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Global Bottom Navigation Bar */}
        <BottomTabBar activeTab="home" />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  authContainer: {
    paddingTop: spacing.lg,
  },
  authCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  authIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  authTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  authSub: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  devHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    gap: 6,
  },
  devHintText: {
    fontSize: fontSizes.xs,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  inputGroup: {
    width: '100%',
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeBadge: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    height: dimensions.inputHeight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  countryCodeText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    height: dimensions.inputHeight,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  otpInput: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    height: dimensions.inputHeight,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
  },
  authButton: {
    width: '100%',
    marginTop: spacing.xs,
  },
  termsText: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
  },
  resendBtn: {
    marginTop: spacing.md,
    minHeight: dimensions.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  bookingContainer: {
    width: '100%',
  },
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  greetingSub: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  greetingTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  logoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  logoutPillText: {
    fontSize: fontSizes.xs,
    color: colors.danger,
    fontWeight: '700',
  },
  cardSpacing: {
    marginBottom: spacing.md,
  },
  horizontalScroll: {
    marginBottom: spacing.md,
  },
  chipsContainer: {
    paddingRight: spacing.md,
  },
  vehicleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  vehicleOptionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    ...shadows.card,
  },
  vehicleOptionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  vehicleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  vehicleName: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  vehicleTextActive: {
    color: colors.primaryDark,
  },
  vehicleFare: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2,
  },
  vehicleFareActive: {
    color: colors.primary,
  },
  vehicleEta: {
    fontSize: fontSizes.xs - 1,
    color: colors.textMuted,
    marginTop: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  paymentOptionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: dimensions.buttonHeight,
  },
  paymentOptionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  paymentName: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginLeft: spacing.xs,
  },
  paymentNameActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  searchingContainer: {
    width: '100%',
  },
  stateCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    alignItems: 'center',
    ...shadows.card,
  },
  stateIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  stateTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stateSub: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  statusChipWrapper: {
    marginVertical: spacing.xs,
  },
  detailSummaryBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cancelBtn: {
    width: '100%',
  },
  assignedContainer: {
    width: '100%',
  },
  assignedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.sm,
  },
  tripStatusTitle: {
    fontSize: fontSizes.md + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tripStatusSub: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  driverProfileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  driverMeta: {
    flex: 1,
  },
  driverName: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  driverVehicle: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  driverActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  driverActionBtn: {
    width: dimensions.minTouchTarget,
    height: dimensions.minTouchTarget,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pickupDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.pickupMarker,
  },
  dropSquareSmall: {
    width: 8,
    height: 8,
    borderRadius: 1,
    backgroundColor: colors.dropMarker,
  },
  locationSummaryText: {
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  locationDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  paymentActionsBox: {
    width: '100%',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  paymentActionTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  cashInstructions: {
    alignItems: 'center',
  },
  cashText: {
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  switchMethodBtn: {
    width: '100%',
  },
  upiActions: {
    gap: spacing.xs,
  },
  upiPayBtn: {
    width: '100%',
  },
  actionBtnMargin: {
    width: '100%',
    marginTop: spacing.xs,
  },
  devSimulationPanel: {
    width: '100%',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  devSimTitle: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  simButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  simPill: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minHeight: 32,
    justifyContent: 'center',
  },
  simPillText: {
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  noDriverContainer: {
    width: '100%',
  },
  freshnessNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  freshnessNoticeText: {
    fontSize: fontSizes.xs,
    color: '#B45309',
    fontWeight: '600',
  },
});
