import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';

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
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'BOOKING' | 'RIDE_CREATED'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('+919000000001');
  const [otp, setOtp] = useState('123456');
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);

  // Booking state
  const [pickup, setPickup] = useState<LocationItem>(KAKINADA_LOCATIONS[0]!);
  const [destination, setDestination] = useState<LocationItem>(KAKINADA_LOCATIONS[1]!);
  const [selectedVehicle, setSelectedVehicle] = useState<'BIKE' | 'AUTO' | 'CAB'>('AUTO');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');

  // Created Ride State
  const [createdRide, setCreatedRide] = useState<{
    id: string;
    status: string;
    vehicleType: string;
    pickupAddress: string;
    dropAddress: string;
    estimatedFare: number;
    paymentMethod: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('OTP');
    }, 500);
  };

  const handleVerifyOtp = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (otp === '123456') {
        setUser({ id: 'mock-rider-001', name: 'Priya Sharma', role: 'RIDER' });
        setStep('BOOKING');
      } else {
        setError('Invalid OTP code. Use test code 123456');
      }
    }, 500);
  };

  const handleBookRide = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const fareMap = { BIKE: 76, AUTO: 108, CAB: 164 };
      const rideId = `ride-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setCreatedRide({
        id: rideId,
        status: 'REQUESTED',
        vehicleType: selectedVehicle,
        pickupAddress: pickup.name,
        dropAddress: destination.name,
        estimatedFare: fareMap[selectedVehicle],
        paymentMethod,
      });
      setStep('RIDE_CREATED');
    }, 800);
  };

  const handleLogout = () => {
    setUser(null);
    setCreatedRide(null);
    setStep('PHONE');
    setOtp('123456');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🚗 YatraSeva</Text>
      <Text style={styles.subtitle}>Rider Booking — Kakinada, AP</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 'PHONE' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rider Mobile Login</Text>
          <Text style={styles.label}>Enter Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+919000000001"
            placeholderTextColor="#8a8a9a"
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.button} onPress={handleRequestOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get OTP</Text>}
          </TouchableOpacity>
        </View>
      )}

      {step === 'OTP' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verify OTP</Text>
          <Text style={styles.info}>OTP sent to {phoneNumber}</Text>
          <Text style={styles.label}>Development Test OTP: 123456</Text>
          <TextInput
            style={styles.input}
            value={otp}
            onChangeText={setOtp}
            placeholder="123456"
            placeholderTextColor="#8a8a9a"
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Login</Text>}
          </TouchableOpacity>
        </View>
      )}

      {step === 'BOOKING' && user && (
        <View style={styles.bookingContainer}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.welcomeText}>Hi, {user.name} 👋</Text>
            <TouchableOpacity style={styles.smallLogoutBtn} onPress={handleLogout}>
              <Text style={styles.smallLogoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Map Preview */}
          <View style={styles.mapCard}>
            <Text style={styles.mapTitle}>🗺️ Kakinada Map Preview (Mock)</Text>
            <Text style={styles.mapSub}>Pickup: 🟢 {pickup.name}</Text>
            <Text style={styles.mapSub}>Drop: 🔴 {destination.name}</Text>
            <Text style={styles.mapSub}>Distance: ~5.35 km | Est: 13 mins</Text>
          </View>

          {/* Pickup Picker */}
          <Text style={styles.sectionLabel}>Select Pickup Location</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {KAKINADA_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc.name}
                style={[styles.chip, pickup.name === loc.name && styles.chipActive]}
                onPress={() => setPickup(loc)}
              >
                <Text style={[styles.chipText, pickup.name === loc.name && styles.chipTextActive]}>
                  📍 {loc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Destination Picker */}
          <Text style={styles.sectionLabel}>Select Destination</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {KAKINADA_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc.name}
                style={[styles.chip, destination.name === loc.name && styles.chipActive]}
                onPress={() => setDestination(loc)}
              >
                <Text style={[styles.chipText, destination.name === loc.name && styles.chipTextActive]}>
                  🏁 {loc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Vehicle Selection */}
          <Text style={styles.sectionLabel}>Choose Vehicle & Fare Estimate</Text>
          <View style={styles.vehicleRow}>
            <TouchableOpacity
              style={[styles.vehicleCard, selectedVehicle === 'BIKE' && styles.vehicleCardActive]}
              onPress={() => setSelectedVehicle('BIKE')}
            >
              <Text style={styles.vehicleIcon}>🏍️</Text>
              <Text style={styles.vehicleName}>Bike</Text>
              <Text style={styles.vehicleFare}>₹76</Text>
              <Text style={styles.vehicleSub}>Fastest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.vehicleCard, selectedVehicle === 'AUTO' && styles.vehicleCardActive]}
              onPress={() => setSelectedVehicle('AUTO')}
            >
              <Text style={styles.vehicleIcon}>🛺</Text>
              <Text style={styles.vehicleName}>Auto</Text>
              <Text style={styles.vehicleFare}>₹108</Text>
              <Text style={styles.vehicleSub}>Popular</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.vehicleCard, selectedVehicle === 'CAB' && styles.vehicleCardActive]}
              onPress={() => setSelectedVehicle('CAB')}
            >
              <Text style={styles.vehicleIcon}>🚗</Text>
              <Text style={styles.vehicleName}>Cab</Text>
              <Text style={styles.vehicleFare}>₹164</Text>
              <Text style={styles.vehicleSub}>AC Comfort</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Method */}
          <Text style={styles.sectionLabel}>Payment Preference</Text>
          <View style={styles.paymentRow}>
            <TouchableOpacity
              style={[styles.payChip, paymentMethod === 'CASH' && styles.payChipActive]}
              onPress={() => setPaymentMethod('CASH')}
            >
              <Text style={styles.payText}>💵 Cash to Driver</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.payChip, paymentMethod === 'UPI' && styles.payChipActive]}
              onPress={() => setPaymentMethod('UPI')}
            >
              <Text style={styles.payText}>📱 UPI / PhonePe / GPay</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Ride Button */}
          <TouchableOpacity style={styles.confirmBtn} onPress={handleBookRide} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmBtnText}>Request {selectedVehicle} Ride</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {step === 'RIDE_CREATED' && createdRide && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ride Requested Successfully! 🎉</Text>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>STATUS: {createdRide.status}</Text>
          </View>

          <View style={styles.rideDetailBox}>
            <Text style={styles.rideDetailText}>🆔 Ride ID: {createdRide.id}</Text>
            <Text style={styles.rideDetailText}>🚙 Vehicle: {createdRide.vehicleType}</Text>
            <Text style={styles.rideDetailText}>🟢 Pickup: {createdRide.pickupAddress}</Text>
            <Text style={styles.rideDetailText}>🔴 Drop: {createdRide.dropAddress}</Text>
            <Text style={styles.rideDetailText}>💰 Estimated Fare: ₹{createdRide.estimatedFare}</Text>
            <Text style={styles.rideDetailText}>💳 Payment: {createdRide.paymentMethod}</Text>
          </View>

          <Text style={styles.noteText}>
            ℹ️ Searching for nearby captains in Kakinada. No driver assigned yet in Phase 3.
          </Text>

          <TouchableOpacity style={styles.button} onPress={() => setStep('BOOKING')}>
            <Text style={styles.buttonText}>Book Another Ride</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 2,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#eaeaea',
    marginBottom: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#0f3460',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#8a8a9a',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    backgroundColor: '#0f3460',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#e94560',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  info: {
    fontSize: 14,
    color: '#eaeaea',
    marginBottom: 8,
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 12,
  },
  bookingContainer: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  smallLogoutBtn: {
    backgroundColor: '#53354a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  smallLogoutText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  mapCard: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#0f3460',
    marginBottom: 16,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#53a8b6',
    marginBottom: 6,
  },
  mapSub: {
    fontSize: 12,
    color: '#eaeaea',
    marginBottom: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8a8a9a',
    marginBottom: 8,
    marginTop: 8,
  },
  chipRow: {
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#16213e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  chipActive: {
    backgroundColor: '#e94560',
    borderColor: '#e94560',
  },
  chipText: {
    color: '#eaeaea',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  vehicleCardActive: {
    borderColor: '#e94560',
    backgroundColor: '#221e3f',
  },
  vehicleIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  vehicleName: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  vehicleFare: {
    color: '#e94560',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 2,
  },
  vehicleSub: {
    color: '#8a8a9a',
    fontSize: 11,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  payChip: {
    flex: 1,
    backgroundColor: '#16213e',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  payChipActive: {
    borderColor: '#53a8b6',
    backgroundColor: '#0f3460',
  },
  payText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: '#e94560',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusBadge: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    color: '#53a8b6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  rideDetailBox: {
    width: '100%',
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  rideDetailText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 6,
  },
  noteText: {
    color: '#8a8a9a',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
});
