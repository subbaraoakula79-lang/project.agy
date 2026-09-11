import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import * as Location from 'expo-location';

const KAKINADA_LANDMARKS = [
  { name: 'Kakinada Railway Station', lat: 16.9558, lng: 82.2386 },
  { name: 'Jagannaickpur Main Road', lat: 16.9891, lng: 82.2475 },
  { name: 'Kakinada Beach Road', lat: 16.9330, lng: 82.2613 },
  { name: 'Sarpavaram Junction', lat: 16.9764, lng: 82.2402 },
  { name: 'Bhanugudi Junction', lat: 16.9910, lng: 82.2370 },
];

export default function DriverScreen() {
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'AUTHENTICATED'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('+918000000001');
  const [otp, setOtp] = useState('123456');
  const [driver, setDriver] = useState<{ id: string; name: string; phone: string; vehicleType: string; regNumber: string } | null>(null);

  // Availability State
  const [status, setStatus] = useState<'OFFLINE' | 'ONLINE_AVAILABLE' | 'BUSY'>('OFFLINE');
  const [currentLocation, setCurrentLocation] = useState(KAKINADA_LANDMARKS[0]!);

  // Device GPS State
  const [gpsPermission, setGpsPermission] = useState<'UNDETERMINED' | 'GRANTED' | 'DENIED'>('UNDETERMINED');
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const [isUploadingLocation, setIsUploadingLocation] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
        if (permStatus === 'granted') {
          setGpsPermission('GRANTED');
          const pos = await Location.getCurrentPositionAsync({});
          setCurrentGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        } else {
          setGpsPermission('DENIED');
        }
      } catch (err) {
        setGpsPermission('DENIED');
      }
    })();
  }, []);

  // Incoming Request State
  const [incomingRequest, setIncomingRequest] = useState<{
    id: string;
    rideId: string;
    pickup: string;
    drop: string;
    fare: number;
    vehicleType: string;
    expiresIn: number;
  } | null>(null);

  // Active Ride State
  const [activeRide, setActiveRide] = useState<{
    rideId: string;
    riderName: string;
    pickup: string;
    drop: string;
    fare: number;
    status: string;
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
        const nameMap: Record<string, { name: string; type: string; plate: string }> = {
          '+918000000001': { name: 'Suresh Babu', type: 'BIKE', plate: 'AP05AB1234' },
          '+918000000002': { name: 'Ramesh Naidu', type: 'AUTO', plate: 'AP05CD5678' },
          '+918000000003': { name: 'Venkat Rao', type: 'CAB', plate: 'AP05EF9012' },
        };
        const info = nameMap[phoneNumber] || { name: 'Captain', type: 'AUTO', plate: 'AP05XX9999' };
        setDriver({
          id: `driver-${Date.now()}`,
          name: info.name,
          phone: phoneNumber,
          vehicleType: info.type,
          regNumber: info.plate,
        });
        setStatus('OFFLINE');
        setStep('AUTHENTICATED');
      } else {
        setError('Invalid OTP code. Use test code 123456');
      }
    }, 400);
  };

  const handleToggleOnline = () => {
    if (status === 'OFFLINE') {
      setStatus('ONLINE_AVAILABLE');
    } else if (status === 'ONLINE_AVAILABLE') {
      setStatus('OFFLINE');
      setIncomingRequest(null);
    }
  };

  const handleSimulateIncomingRequest = () => {
    if (status !== 'ONLINE_AVAILABLE') {
      setError('Must be ONLINE_AVAILABLE to receive ride requests');
      return;
    }
    setError('');
    setIncomingRequest({
      id: `req-${Date.now()}`,
      rideId: `ride-sim-${Math.random().toString(36).substring(2, 6)}`,
      pickup: 'Kakinada Railway Station',
      drop: 'Jagannaickpur Main Road',
      fare: driver?.vehicleType === 'BIKE' ? 76 : driver?.vehicleType === 'AUTO' ? 108 : 164,
      vehicleType: driver?.vehicleType || 'AUTO',
      expiresIn: 30,
    });
  };

  const handleAcceptRequest = () => {
    if (!incomingRequest) return;
    setStatus('BUSY');
    setActiveRide({
      rideId: incomingRequest.rideId,
      riderName: 'Priya Sharma',
      pickup: incomingRequest.pickup,
      drop: incomingRequest.drop,
      fare: incomingRequest.fare,
      status: 'DRIVER_ASSIGNED',
    });
    setIncomingRequest(null);
  };

  const handleRejectRequest = () => {
    setIncomingRequest(null);
    // Driver remains ONLINE_AVAILABLE
  };

  const handleMarkArriving = () => {
    setActiveRide((prev) => (prev ? { ...prev, status: 'DRIVER_ARRIVING' } : null));
  };

  const handleMarkArrived = () => {
    setActiveRide((prev) => (prev ? { ...prev, status: 'DRIVER_ARRIVED' } : null));
  };

  const handleStartRide = () => {
    setActiveRide((prev) => (prev ? { ...prev, status: 'RIDE_STARTED' } : null));
  };

  const handleCompleteRide = () => {
    // Phase 5A: Ride becomes PAYMENT_PENDING, Driver remains BUSY
    setActiveRide((prev) => (prev ? { ...prev, status: 'PAYMENT_PENDING' } : null));
    setStatus('BUSY');
  };

  const handleDriverCancelRide = () => {
    setActiveRide(null);
    setStatus('ONLINE_AVAILABLE');
  };

  const handleDismissPending = () => {
    setActiveRide(null);
    setStatus('ONLINE_AVAILABLE');
  };

  const handleLogout = () => {
    setDriver(null);
    setStatus('OFFLINE');
    setIncomingRequest(null);
    setActiveRide(null);
    setStep('PHONE');
    setOtp('123456');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🛺 YatraSeva Captain</Text>
      <Text style={styles.subtitle}>Driver Partner — Kakinada</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 'PHONE' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Captain Login</Text>
          <Text style={styles.label}>Enter Registered Driver Phone</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="+918000000001"
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

      {step === 'AUTHENTICATED' && driver && (
        <View style={styles.authenticatedBox}>
          {/* Captain Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.captainName}>Captain {driver.name}</Text>
              <Text style={styles.captainSub}>
                {driver.vehicleType} • {driver.regNumber}
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Availability Toggle */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Duty Availability</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusIndicator,
                  status === 'ONLINE_AVAILABLE'
                    ? styles.statusOnline
                    : status === 'BUSY'
                    ? styles.statusBusy
                    : styles.statusOffline,
                ]}
              >
                <Text style={styles.statusIndicatorText}>{status}</Text>
              </View>
            </View>

            {status !== 'BUSY' ? (
              <TouchableOpacity
                style={[styles.toggleBtn, status === 'ONLINE_AVAILABLE' ? styles.btnGoOffline : styles.btnGoOnline]}
                onPress={handleToggleOnline}
              >
                <Text style={styles.toggleBtnText}>
                  {status === 'ONLINE_AVAILABLE' ? '🔴 Go Offline' : '🟢 Go Online & Available'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.busyNotice}>⚠️ Currently on an active ride. Cannot change duty status.</Text>
            )}
          </View>

          {/* Location Update */}
          <View style={[styles.card, { marginTop: 14 }]}>
            <Text style={styles.sectionTitle}>📍 Current Position & GPS Tracking</Text>
            <Text style={styles.info}>
              GPS Permission: {gpsPermission === 'GRANTED' ? '🟢 Granted' : '🔴 Denied/Pending'}
            </Text>
            {currentGps && (
              <Text style={{ color: '#27ae60', fontSize: 13, marginVertical: 4 }}>
                Lat: {currentGps.lat.toFixed(4)}, Lng: {currentGps.lng.toFixed(4)} (Accuracy: {currentGps.accuracy ?? 5}m)
              </Text>
            )}
            {status !== 'OFFLINE' && (
              <TouchableOpacity
                style={{ marginTop: 8, padding: 8, backgroundColor: '#34495e', borderRadius: 6 }}
                onPress={() => {
                  setIsUploadingLocation(true);
                  setTimeout(() => setIsUploadingLocation(false), 500);
                }}
              >
                <Text style={{ color: '#ecf0f1', fontSize: 13, textAlign: 'center' }}>
                  {isUploadingLocation ? '⏳ Syncing GPS Location...' : '🔄 Force Manual Location Sync'}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={styles.label}>Select Simulated Landmark</Text>
            <Text style={styles.currentLocText}>Active: {currentLocation.name}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locScroll}>
              {KAKINADA_LANDMARKS.map((loc) => (
                <TouchableOpacity
                  key={loc.name}
                  style={[styles.locChip, currentLocation.name === loc.name && styles.locChipActive]}
                  onPress={() => setCurrentLocation(loc)}
                >
                  <Text style={[styles.locChipText, currentLocation.name === loc.name && styles.locChipTextActive]}>
                    {loc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Simulate Ride Offer Button */}
          {status === 'ONLINE_AVAILABLE' && !incomingRequest && !activeRide && (
            <TouchableOpacity style={styles.simBtn} onPress={handleSimulateIncomingRequest}>
              <Text style={styles.simBtnText}>⚡ Simulate Incoming Ride Request</Text>
            </TouchableOpacity>
          )}

          {/* Incoming Ride Request Offer Screen */}
          {incomingRequest && (
            <View style={[styles.card, styles.offerCard]}>
              <Text style={styles.offerTitle}>🚨 NEW RIDE OFFER! 🚨</Text>
              <Text style={styles.offerFare}>₹{incomingRequest.fare}</Text>
              <Text style={styles.offerVehicle}>Type: {incomingRequest.vehicleType}</Text>

              <View style={styles.offerDetails}>
                <Text style={styles.offerLoc}>🟢 Pickup: {incomingRequest.pickup}</Text>
                <Text style={styles.offerLoc}>🔴 Drop: {incomingRequest.drop}</Text>
              </View>

              <View style={styles.btnActionRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={handleAcceptRequest}>
                  <Text style={styles.actionBtnText}>✅ Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={handleRejectRequest}>
                  <Text style={styles.actionBtnText}>❌ Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Active Assigned Ride */}
          {activeRide && (
            <View style={[styles.card, styles.activeRideCard]}>
              <Text style={styles.activeTitle}>🚖 ACTIVE RIDE: {activeRide.status}</Text>
              <Text style={styles.activeText}>Rider: {activeRide.riderName}</Text>
              <Text style={styles.activeText}>Pickup: {activeRide.pickup}</Text>
              <Text style={styles.activeText}>Drop: {activeRide.drop}</Text>
              <Text style={styles.activeText}>Fare: ₹{activeRide.fare}</Text>

              {/* State-aware action workflow */}
              {activeRide.status === 'DRIVER_ASSIGNED' && (
                <View style={{ marginTop: 12, gap: 8 }}>
                  <TouchableOpacity style={[styles.completeBtn, { backgroundColor: '#2980b9' }]} onPress={handleMarkArriving}>
                    <Text style={styles.completeBtnText}>🚗 Mark Arriving</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.completeBtn, { backgroundColor: '#c0392b' }]} onPress={handleDriverCancelRide}>
                    <Text style={styles.completeBtnText}>Cancel Assignment</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeRide.status === 'DRIVER_ARRIVING' && (
                <View style={{ marginTop: 12, gap: 8 }}>
                  <TouchableOpacity style={[styles.completeBtn, { backgroundColor: '#8e44ad' }]} onPress={handleMarkArrived}>
                    <Text style={styles.completeBtnText}>📍 Mark Arrived</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.completeBtn, { backgroundColor: '#c0392b' }]} onPress={handleDriverCancelRide}>
                    <Text style={styles.completeBtnText}>Cancel Assignment</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeRide.status === 'DRIVER_ARRIVED' && (
                <View style={{ marginTop: 12, gap: 8 }}>
                  <TouchableOpacity style={[styles.completeBtn, { backgroundColor: '#27ae60' }]} onPress={handleStartRide}>
                    <Text style={styles.completeBtnText}>▶️ Start Ride</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.completeBtn, { backgroundColor: '#c0392b' }]} onPress={handleDriverCancelRide}>
                    <Text style={styles.completeBtnText}>Cancel Assignment</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeRide.status === 'RIDE_STARTED' && (
                <View style={{ marginTop: 12 }}>
                  <TouchableOpacity style={styles.completeBtn} onPress={handleCompleteRide}>
                    <Text style={styles.completeBtnText}>🏁 Complete Ride</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeRide.status === 'PAYMENT_PENDING' && (
                <View style={{ marginTop: 12, alignItems: 'center', backgroundColor: '#1a1a2e', padding: 14, borderRadius: 8, width: '100%' }}>
                  <Text style={{ color: '#f39c12', fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>
                    ⏳ Payment Pending — Fare: ₹{activeRide.fare}
                  </Text>
                  <Text style={{ color: '#eaeaea', fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
                    Trip reached destination. Collect ₹{activeRide.fare} cash from rider or await online payment. Duty status: BUSY.
                  </Text>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#27ae60', marginBottom: 10, width: '100%' }]}
                    onPress={() => {
                      setStatus('ONLINE_AVAILABLE');
                      setActiveRide(null);
                    }}
                  >
                    <Text style={[styles.buttonText, { color: '#fff' }]}>💵 Confirm Cash Collected & Unlock Duty ✅</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#7f8c8d', width: '100%' }]} onPress={handleDismissPending}>
                    <Text style={styles.actionBtnText}>Reset / Next Ride</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#0f3460',
    alignItems: 'center',
    minHeight: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f9a826',
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
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  label: {
    fontSize: 12,
    color: '#8a8a9a',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#f9a826',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#1a1a2e',
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
  authenticatedBox: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  captainName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  captainSub: {
    fontSize: 13,
    color: '#f9a826',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#e94560',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  statusRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusIndicatorText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
  },
  statusOnline: {
    backgroundColor: '#27ae60',
  },
  statusBusy: {
    backgroundColor: '#e67e22',
  },
  statusOffline: {
    backgroundColor: '#7f8c8d',
  },
  toggleBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnGoOnline: {
    backgroundColor: '#27ae60',
  },
  btnGoOffline: {
    backgroundColor: '#e74c3c',
  },
  toggleBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  busyNotice: {
    color: '#f39c12',
    textAlign: 'center',
    fontSize: 13,
  },
  currentLocText: {
    color: '#53a8b6',
    fontSize: 13,
    marginBottom: 8,
  },
  locScroll: {
    marginTop: 4,
  },
  locChip: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  locChipActive: {
    backgroundColor: '#f9a826',
  },
  locChipText: {
    color: '#ccc',
    fontSize: 12,
  },
  locChipTextActive: {
    color: '#1a1a2e',
    fontWeight: 'bold',
  },
  simBtn: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14,
  },
  simBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  offerCard: {
    marginTop: 16,
    borderColor: '#f9a826',
    borderWidth: 2,
    backgroundColor: '#241e38',
  },
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f9a826',
    textAlign: 'center',
  },
  offerFare: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2ecc71',
    textAlign: 'center',
    marginVertical: 4,
  },
  offerVehicle: {
    color: '#eaeaea',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 10,
  },
  offerDetails: {
    backgroundColor: '#1a1a2e',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  offerLoc: {
    color: '#fff',
    fontSize: 13,
    marginVertical: 2,
  },
  btnActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  acceptBtn: {
    backgroundColor: '#27ae60',
  },
  rejectBtn: {
    backgroundColor: '#e74c3c',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  activeRideCard: {
    marginTop: 16,
    borderColor: '#27ae60',
    borderWidth: 2,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginBottom: 8,
  },
  activeText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  completeBtn: {
    backgroundColor: '#2980b9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  completeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
