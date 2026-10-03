// apps/rider-mobile/app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme';
import { AuthProvider } from '../context/AuthContext';

/**
 * Root layout for the YatraSeva Rider app.
 * Provides shared AuthContext and modern Indian ride-hailing styling.
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          statusBarTranslucent: true,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'YatraSeva' }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="otp" options={{ title: 'Verify OTP' }} />
        <Stack.Screen name="history" options={{ title: 'Rides' }} />
        <Stack.Screen name="safety" options={{ title: 'Safety' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      </Stack>
    </AuthProvider>
  );
}
