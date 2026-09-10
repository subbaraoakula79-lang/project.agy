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
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'BOOKING' | 'SEARCHING' | 'ASSIGNED' | 'NO_DRIVER'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('+919000000001');
  const [otp, setOtp] = useState('123456');
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);

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
                  vehicleModel: selectedVehicle === 'BIKE' ? 'Honda Activa 6G' : selectedVehicle === 'AUTO' ? 'Bajaj RE Compact' : 'Maruti Swift Dzire',
                  regNumber: selectedVehicle === 'BIKE' ? 'AP05AB1234' : selectedVehicle === 'AUTO' ? 'AP05CD5678' : 'AP05EF9012',
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
            <Text style={styles.mapTitle}>🗺️ Kakinada Route Preview</Text>
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

          {/* Vehicle Type Picker */}
          <Text style={styles.sectionLabel}>Select Vehicle</Text>
          <View style={styles.vehicleRow}>
            {(['BIKE', 'AUTO', 'CAB'] as const).map((vt) => (
              <TouchableOpacity
                key={vt}
                style={[styles.vehicleCard, selectedVehicle === vt && styles.vehicleCardActive]}
                onPress={() => setSelectedVehicle(vt)}
              >
                <Text style={styles.vehicleIcon}>{vt === 'BIKE' ? '🏍️' : vt === 'AUTO' ? '🛺' : '🚗'}</Text>
                <Text style={styles.vehicleFare}>₹{vt === 'BIKE' ? 76 : vt === 'AUTO' ? 108 : 164}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Payment Method Picker */}
          <Text style={styles.sectionLabel}>Select Payment Method</Text>
          <View style={styles.vehicleRow}>
            {(['CASH', 'UPI'] as const).map((pm) => (
              <TouchableOpacity
                key={pm}
                style={[styles.vehicleCard, paymentMethod === pm && styles.vehicleCardActive]}
                onPress={() => setPaymentMethod(pm)}
              >
                <Text style={styles.vehicleIcon}>{pm === 'CASH' ? '💵' : '📱'}</Text>
                <Text style={styles.vehicleName}>{pm}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Confirm Ride Button */}
          <TouchableOpacity style={styles.confirmBtn} onPress={() => handleBookRide(false)} disabled={loading}>
            <Text style={styles.confirmBtnText}>Request {selectedVehicle} Ride</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'SEARCHING' && currentRide && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Finding Your Captain...</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#f39c12' }]}>
            <Text style={styles.statusText}>STATUS: SEARCHING_DRIVER</Text>
          </View>
          <ActivityIndicator size="large" color="#f39c12" style={{ marginVertical: 20 }} />
          <Text style={styles.info}>Searching nearby captains in Kakinada...</Text>
          <View style={styles.rideDetailBox}>
            <Text style={styles.rideDetailText}>🆔 Ride ID: {currentRide.id}</Text>
            <Text style={styles.rideDetailText}>🚙 Vehicle: {currentRide.vehicleType}</Text>
            <Text style={styles.rideDetailText}>🟢 Pickup: {currentRide.pickupAddress}</Text>
            <Text style={styles.rideDetailText}>🔴 Drop: {currentRide.dropAddress}</Text>
            <Text style={styles.rideDetailText}>💰 Fare: ₹{currentRide.estimatedFare}</Text>
          </View>
        </View>
      )}

      {step === 'ASSIGNED' && currentRide && (
        <View style={styles.card}>
          {currentRide.status === 'DRIVER_ASSIGNED' && (
            <>
              <Text style={styles.cardTitle}>Captain Assigned! 🚖</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#27ae60' }]}>
                <Text style={styles.statusText}>STATUS: DRIVER_ASSIGNED</Text>
              </View>
              <Text style={styles.info}>Captain has accepted your booking and is preparing to arrive.</Text>
            </>
          )}

          {currentRide.status === 'DRIVER_ARRIVING' && (
            <>
              <Text style={styles.cardTitle}>Captain On The Way! 🚗</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#3498db' }]}>
                <Text style={styles.statusText}>STATUS: DRIVER_ARRIVING</Text>
              </View>
              <Text style={styles.info}>Captain is navigating to your pickup location.</Text>
            </>
          )}

          {currentRide.status === 'DRIVER_ARRIVED' && (
            <>
              <Text style={styles.cardTitle}>Captain Has Arrived! 📍</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#9b59b6' }]}>
                <Text style={styles.statusText}>STATUS: DRIVER_ARRIVED</Text>
              </View>
              <Text style={styles.info}>Captain is waiting at the pickup location. Please board the vehicle.</Text>
            </>
          )}

          {currentRide.status === 'RIDE_STARTED' && (
            <>
              <Text style={styles.cardTitle}>Trip In Progress 🛣️</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#2980b9' }]}>
                <Text style={styles.statusText}>STATUS: RIDE_STARTED</Text>
              </View>
              <Text style={styles.info}>Heading towards {currentRide.dropAddress}. Have a safe ride!</Text>
            </>
          )}

          {currentRide.status === 'RIDE_COMPLETED' && (
            <>
              <Text style={styles.cardTitle}>Trip Completed! 🏁</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#2ecc71' }]}>
                <Text style={styles.statusText}>STATUS: RIDE_COMPLETED</Text>
              </View>
              <Text style={styles.info}>You have arrived at your destination.</Text>
            </>
          )}

          {currentRide.status === 'PAYMENT_PENDING' && (
            <>
              <Text style={styles.cardTitle}>Payment Pending ⏳</Text>
              <View style={[styles.statusBadge, { backgroundColor: '#e67e22' }]}>
                <Text style={styles.statusText}>STATUS: PAYMENT_PENDING</Text>
              </View>
              <Text style={[styles.info, { color: '#f39c12' }]}>
                Trip finished! Fare of ₹{currentRide.estimatedFare} is pending payment settlement (Phase 5B).
              </Text>
            </>
          )}

          {currentRide.driver && (
            <View style={styles.driverCard}>
              <Text style={styles.driverName}>Captain: {currentRide.driver.name}</Text>
              <Text style={styles.driverPhone}>📞 Phone: {currentRide.driver.phone}</Text>
              <Text style={styles.driverVehicle}>🛺 Vehicle: {currentRide.driver.vehicleModel}</Text>
              <Text style={styles.driverReg}>🔢 Plate: {currentRide.driver.regNumber}</Text>
            </View>
          )}

          <View style={styles.rideDetailBox}>
            <Text style={styles.rideDetailText}>🆔 Ride ID: {currentRide.id}</Text>
            <Text style={styles.rideDetailText}>🟢 Pickup: {currentRide.pickupAddress}</Text>
            <Text style={styles.rideDetailText}>🔴 Drop: {currentRide.dropAddress}</Text>
            <Text style={styles.rideDetailText}>💰 Fare: ₹{currentRide.estimatedFare}</Text>
            <Text style={styles.rideDetailText}>💳 Method: {currentRide.paymentMethod}</Text>
          </View>

          {/* Cancellation Control — Allowed only before arrival */}
          {(currentRide.status === 'DRIVER_ASSIGNED' || currentRide.status === 'DRIVER_ARRIVING') && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#c0392b', marginTop: 12 }]}
              onPress={() => {
                setCurrentRide((prev) => (prev ? { ...prev, status: 'CANCELLED_BY_RIDER' } : null));
                setError('Ride cancelled by you.');
                setTimeout(() => setStep('BOOKING'), 1500);
              }}
            >
              <Text style={styles.buttonText}>Cancel Ride</Text>
            </TouchableOpacity>
          )}

          {currentRide.status === 'DRIVER_ARRIVED' && (
            <Text style={[styles.info, { fontSize: 12, color: '#e74c3c', marginTop: 8 }]}>
              ⚠️ Cancellation restricted: Captain has already arrived.
            </Text>
          )}

          {/* Test State Advancement Simulator Controls for Development */}
          <View style={{ marginTop: 16, width: '100%', borderTopWidth: 1, borderTopColor: '#0f3460', paddingTop: 10 }}>
            <Text style={{ color: '#8a8a9a', fontSize: 11, textAlign: 'center', marginBottom: 8 }}>
              🧪 Dev Simulation: Advance State
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
              {currentRide.status === 'DRIVER_ASSIGNED' && (
                <TouchableOpacity
                  style={[styles.smallLogoutBtn, { backgroundColor: '#2980b9' }]}
                  onPress={() => setCurrentRide((prev) => (prev ? { ...prev, status: 'DRIVER_ARRIVING' } : null))}
                >
                  <Text style={styles.smallLogoutText}>Arriving ⏩</Text>
                </TouchableOpacity>
              )}
              {currentRide.status === 'DRIVER_ARRIVING' && (
                <TouchableOpacity
                  style={[styles.smallLogoutBtn, { backgroundColor: '#8e44ad' }]}
                  onPress={() => setCurrentRide((prev) => (prev ? { ...prev, status: 'DRIVER_ARRIVED' } : null))}
                >
                  <Text style={styles.smallLogoutText}>Arrived ⏩</Text>
                </TouchableOpacity>
              )}
              {currentRide.status === 'DRIVER_ARRIVED' && (
                <TouchableOpacity
                  style={[styles.smallLogoutBtn, { backgroundColor: '#16a085' }]}
                  onPress={() => setCurrentRide((prev) => (prev ? { ...prev, status: 'RIDE_STARTED' } : null))}
                >
                  <Text style={styles.smallLogoutText}>Start Trip ⏩</Text>
                </TouchableOpacity>
              )}
              {currentRide.status === 'RIDE_STARTED' && (
                <TouchableOpacity
                  style={[styles.smallLogoutBtn, { backgroundColor: '#d35400' }]}
                  onPress={() => setCurrentRide((prev) => (prev ? { ...prev, status: 'PAYMENT_PENDING' } : null))}
                >
                  <Text style={styles.smallLogoutText}>Complete Trip ⏩</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {currentRide.status === 'PAYMENT_PENDING' && (
            <TouchableOpacity style={[styles.button, { marginTop: 14 }]} onPress={() => setStep('BOOKING')}>
              <Text style={styles.buttonText}>Book Another Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {step === 'NO_DRIVER' && currentRide && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No Captains Available 😔</Text>
          <View style={[styles.statusBadge, { backgroundColor: '#e74c3c' }]}>
            <Text style={styles.statusText}>STATUS: CANCELLED_NO_DRIVER</Text>
          </View>
          <Text style={styles.info}>All captains in Kakinada are currently busy or offline.</Text>
          <TouchableOpacity style={[styles.button, { marginTop: 20 }]} onPress={() => setStep('BOOKING')}>
            <Text style={styles.buttonText}>Try Again</Text>
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
    textAlign: 'center',
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 12,
    textAlign: 'center',
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
    backgroundColor: '#e94560',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  smallLogoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mapCard: {
    backgroundColor: '#0f3460',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  mapTitle: {
    color: '#53a8b6',
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 4,
  },
  mapSub: {
    color: '#eaeaea',
    fontSize: 13,
    marginBottom: 2,
  },
  sectionLabel: {
    color: '#8a8a9a',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  chipRow: {
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#e94560',
  },
  chipText: {
    color: '#eaeaea',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  vehicleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: '#0f3460',
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleCardActive: {
    borderColor: '#e94560',
    backgroundColor: '#1f4068',
  },
  vehicleIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  vehicleName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  vehicleFare: {
    color: '#53a8b6',
    fontSize: 13,
    marginTop: 2,
  },
  confirmBtn: {
    backgroundColor: '#e94560',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  rideDetailBox: {
    width: '100%',
    backgroundColor: '#0f3460',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  rideDetailText: {
    color: '#eaeaea',
    fontSize: 14,
    marginBottom: 4,
  },
  driverCard: {
    width: '100%',
    backgroundColor: '#1a365d',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2b6cb0',
  },
  driverName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  driverPhone: {
    color: '#90cdf4',
    fontSize: 14,
    marginBottom: 2,
  },
  driverVehicle: {
    color: '#e2e8f0',
    fontSize: 14,
    marginBottom: 2,
  },
  driverReg: {
    color: '#63b3ed',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
