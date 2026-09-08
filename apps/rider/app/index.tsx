import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

/**
 * Rider App — Auth & Home Screen.
 * Demonstrates basic authentication state handling:
 * Unauthenticated -> Request OTP -> Verify OTP -> Authenticated Shell
 */
export default function RiderScreen() {
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'AUTHENTICATED'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('+919000000001');
  const [otp, setOtp] = useState('123456');
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestOtp = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('OTP');
    }, 600);
  };

  const handleVerifyOtp = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (otp === '123456') {
        setUser({ id: 'mock-rider-001', name: 'Priya Sharma', role: 'RIDER' });
        setStep('AUTHENTICATED');
      } else {
        setError('Invalid OTP code. Use test code 123456');
      }
    }, 600);
  };

  const handleLogout = () => {
    setUser(null);
    setStep('PHONE');
    setOtp('123456');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚗 YatraSeva</Text>
      <Text style={styles.subtitle}>Rider App — Kakinada</Text>

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
          <TouchableOpacity onPress={() => setStep('PHONE')} style={styles.linkButton}>
            <Text style={styles.linkText}>Change Phone Number</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'AUTHENTICATED' && user && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome, {user.name}!</Text>
          <Text style={styles.info}>Role: {user.role}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✅ Rider Authenticated</Text>
          </View>
          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e94560',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#eaeaea',
    marginBottom: 24,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
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
  logoutButton: {
    backgroundColor: '#53354a',
    marginTop: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 12,
  },
  linkText: {
    color: '#53a8b6',
    fontSize: 14,
  },
  info: {
    fontSize: 14,
    color: '#eaeaea',
    marginBottom: 8,
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 12,
    textAlign: 'center',
  },
  badge: {
    backgroundColor: '#0f3460',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  badgeText: {
    color: '#53a8b6',
    fontSize: 14,
    fontWeight: '600',
  },
});
