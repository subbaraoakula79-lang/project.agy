import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * Root layout for the YatraSeva Driver/Captain app.
 *
 * Navigation structure (to be built in later phases):
 * - (auth)/login          — Phone + OTP login
 * - (onboarding)/         — Document upload, vehicle registration
 * - (tabs)/home           — Online/offline toggle, incoming rides
 * - (tabs)/earnings       — Daily/weekly earnings
 * - (tabs)/rides          — Ride history
 * - (tabs)/profile        — Driver profile
 * - ride/[id]             — Active ride (navigate, arrive, complete)
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0f3460' },
          headerTintColor: '#e94560',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'YatraSeva Captain' }} />
      </Stack>
    </>
  );
}
