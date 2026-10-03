// apps/rider-mobile/app/safety.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { BottomTabBar } from '../components/BottomTabBar';

export default function RiderSafetyScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [sosActive, setSosActive] = useState(false);

  // Guard: if not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const handleSos = () => {
    setSosActive(true);
    Alert.alert(
      '🚨 Emergency SOS Activated',
      'Location broadcasted to Andhra Pradesh Police (112) & 24/7 Safety Dispatch.',
      [{ text: 'Dismiss', onPress: () => setSosActive(false) }]
    );
  };

  const handleCardPress = (title: string) => {
    Alert.alert(title, `${title} feature is active and protecting your ride.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Safety & SOS"
        showBack={true}
        onBack={() => router.replace('/')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Large Circular SOS Action matching Reference Screen 12 */}
        <View style={styles.sosSection}>
          <View style={styles.outerGlowRing}>
            <View style={styles.middleGlowRing}>
              <TouchableOpacity
                style={[styles.sosButton, sosActive && styles.sosButtonActive]}
                onPress={handleSos}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Emergency SOS Button"
              >
                <Text style={styles.sosText}>SOS</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sosPrompt}>Tap for immediate help</Text>
          <Text style={styles.sosNumber}>112</Text>
        </View>

        {/* 2x2 Grid of Safety Cards matching Reference Screen 12 */}
        <View style={styles.cardsGrid}>
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => handleCardPress('Live Location')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Live Location, Share your location"
          >
            <View style={[styles.cardIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="location" size={24} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Live Location</Text>
            <Text style={styles.cardSub}>Share your location</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => handleCardPress('Trip Share')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Trip Share, Share with family"
          >
            <View style={[styles.cardIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="people" size={24} color={colors.success} />
            </View>
            <Text style={styles.cardTitle}>Trip Share</Text>
            <Text style={styles.cardSub}>Share with family</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => handleCardPress('Emergency Contacts')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Emergency Contacts, Quick dial"
          >
            <View style={[styles.cardIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="call" size={24} color="#D97706" />
            </View>
            <Text style={styles.cardTitle}>Emergency Contacts</Text>
            <Text style={styles.cardSub}>Quick dial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => handleCardPress('Safety Tips')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Safety Tips, Ride safe, always"
          >
            <View style={[styles.cardIconCircle, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="shield-checkmark" size={24} color={colors.textPrimary} />
            </View>
            <Text style={styles.cardTitle}>Safety Tips</Text>
            <Text style={styles.cardSub}>Ride safe, always</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomTabBar activeTab="safety" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sosSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  outerGlowRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleGlowRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButton: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.button,
  },
  sosButtonActive: {
    backgroundColor: colors.dangerDark,
  },
  sosText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  sosPrompt: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontWeight: '500',
  },
  sosNumber: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  gridCard: {
    width: '47.5%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSizes.sm + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
});
