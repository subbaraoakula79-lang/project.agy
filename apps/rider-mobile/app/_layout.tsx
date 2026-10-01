import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from './theme';

/**
 * Root layout for the YatraSeva Rider app.
 * Light theme, modern Indian ride-hailing styling.
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" backgroundColor={colors.surface} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="history" options={{ title: 'Rides' }} />
        <Stack.Screen name="safety" options={{ title: 'Safety' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      </Stack>
    </>
  );
}
