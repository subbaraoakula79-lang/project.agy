import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * Root layout for the YatraSeva Rider app.
 *
 * Navigation structure (to be built in later phases):
 * - (auth)/login      — Phone + OTP login
 * - (tabs)/home       — Map view, booking flow
 * - (tabs)/rides      — Ride history
 * - (tabs)/profile    — User profile
 * - ride/[id]         — Active ride tracking
 * - booking/          — Vehicle selection, fare estimate
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a2e' },
          headerTintColor: '#e94560',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'YatraSeva' }} />
      </Stack>
    </>
  );
}
