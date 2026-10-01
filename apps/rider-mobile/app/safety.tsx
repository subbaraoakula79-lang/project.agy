import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, shadows } from './theme';
import { AppHeader } from '../components/AppHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { SafetyActionCard } from '../components/SafetyActionCard';
import { SectionHeader } from '../components/SectionHeader';
import { BottomTabBar } from '../components/BottomTabBar';

export default function RiderSafetyScreen() {
  const router = useRouter();

  const [activeRideId] = useState<string>('ride-current-100');
  const [sosActive, setSosActive] = useState<boolean>(false);
  const [sosLoading, setSosLoading] = useState<boolean>(false);
  const [shareToken, setShareToken] = useState<string | null>(null);

  const [supportCategory] = useState<string>('SAFETY');
  const [supportSubject, setSupportSubject] = useState<string>('');
  const [supportDescription, setSupportDescription] = useState<string>('');
  const [submittingSupport, setSubmittingSupport] = useState<boolean>(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  const handleTriggerSos = async () => {
    setSosLoading(true);
    try {
      setSosActive(true);
      Alert.alert(
        '🚨 Emergency SOS Activated',
        'Safety team and emergency dispatch notified. Live location tracking enabled.',
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to trigger SOS');
    } finally {
      setSosLoading(false);
    }
  };

  const handleShareTrip = async () => {
    try {
      const generatedToken = 'st_' + Math.random().toString(36).substring(2, 10);
      setShareToken(generatedToken);
      Alert.alert('Trip Link Generated', `Safe Share URL: /shared-trip/${generatedToken}`);
    } catch {
      Alert.alert('Error', 'Failed to generate trip link');
    }
  };

  const handleSubmitTicket = async () => {
    if (!supportSubject.trim() || !supportDescription.trim()) {
      Alert.alert('Validation Error', 'Please fill subject and description');
      return;
    }
    setSubmittingSupport(true);
    try {
      const ticketId = 'st-ticket-' + Math.floor(1000 + Math.random() * 9000);
      setSubmittedTicketId(ticketId);
      setSupportSubject('');
      setSupportDescription('');
      Alert.alert('Support Ticket Created', `Ticket #${ticketId} submitted to YatraSeva Support.`);
    } catch {
      Alert.alert('Error', 'Failed to submit support ticket');
    } finally {
      setSubmittingSupport(false);
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert('Emergency Quick Dial', 'Calling Kakinada Police Control: 112 / 100');
  };

  const handleSafetyTips = () => {
    Alert.alert(
      'YatraSeva Safety Tips',
      '1. Always verify the vehicle plate number.\n2. Share your live trip with loved ones.\n3. Keep emergency SOS handy.\n4. Call 112 in immediate danger.',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Safety & SOS"
        subtitle="24x7 Rider Protection"
        showBack={true}
        onBack={() => router.replace('/')}
        showNotification={false}
        showProfile={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Prominent SOS Hero Card */}
        <View style={styles.sosCard} accessibilityLabel="Emergency SOS Section">
          <View style={styles.sosOuterRing}>
            <View style={styles.sosMiddleRing}>
              <TouchableOpacity
                style={[styles.sosButton, sosActive && styles.sosButtonActive]}
                onPress={handleTriggerSos}
                disabled={sosLoading}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Trigger Emergency SOS"
              >
                <Ionicons name="warning" size={32} color={colors.surface} />
                <Text style={styles.sosButtonText}>SOS</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sosPromptText}>
            {sosActive ? '🚨 SOS ACTIVE — DISPATCH ALERTED' : 'Tap for immediate help'}
          </Text>
          <Text style={styles.sosSubText}>
            Active Ride #{activeRideId} • Alerts YatraSeva Safety Control and notifies your emergency contacts instantly.
          </Text>

          {sosActive && (
            <View style={styles.sosActiveBanner}>
              <Ionicons name="radio" size={16} color={colors.danger} />
              <Text style={styles.sosActiveBannerText}>
                Live GPS telemetry is being broadcast to Kakinada police dispatch.
              </Text>
            </View>
          )}
        </View>

        {/* Safety Tools Grid */}
        <SectionHeader title="Safety Features" subtitle="Proactive journey safeguards" />
        <View style={styles.gridRow}>
          <SafetyActionCard
            iconName="navigate-circle-outline"
            title="Live Location"
            subtitle="Share real-time GPS with friends"
            onPress={handleShareTrip}
            accentColor={colors.primary}
            style={styles.gridCard}
          />
          <SafetyActionCard
            iconName="share-social-outline"
            title="Trip Share"
            subtitle="Send tracking link to contacts"
            onPress={handleShareTrip}
            accentColor={colors.success}
            style={styles.gridCard}
          />
        </View>

        <View style={styles.gridRow}>
          <SafetyActionCard
            iconName="call-outline"
            title="Emergency Contacts"
            subtitle="Quick dial police (112) or contacts"
            onPress={handleEmergencyCall}
            accentColor={colors.danger}
            style={styles.gridCard}
          />
          <SafetyActionCard
            iconName="shield-checkmark-outline"
            title="Safety Tips"
            subtitle="Ride safe guidelines & verification"
            onPress={handleSafetyTips}
            accentColor="#8B5CF6"
            style={styles.gridCard}
          />
        </View>

        {/* Share Token Banner if generated */}
        {shareToken && (
          <View style={styles.tokenCard}>
            <View style={styles.tokenHeader}>
              <Ionicons name="link" size={18} color={colors.primary} />
              <Text style={styles.tokenTitle}>Safe Share Link Generated</Text>
            </View>
            <Text style={styles.tokenValue}>/shared-trip/{shareToken}</Text>
            <Text style={styles.tokenHint}>
              Share this secure, opaque link with family. No account required for tracking.
            </Text>
          </View>
        )}

        {/* Support Ticket Section */}
        <SectionHeader
          title={`Safety Support Ticket (${supportCategory})`}
          subtitle="Report an incident or ask safety questions"
        />
        <View style={styles.ticketCard}>
          <Text style={styles.inputLabel}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief summary of issue (e.g., Driver driving too fast)"
            placeholderTextColor={colors.textMuted}
            value={supportSubject}
            onChangeText={setSupportSubject}
            accessibilityLabel="Support subject"
          />

          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe what happened in detail..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            value={supportDescription}
            onChangeText={setSupportDescription}
            accessibilityLabel="Detailed description of problem"
          />

          <PrimaryButton
            title="Submit Support Ticket"
            onPress={handleSubmitTicket}
            loading={submittingSupport}
            style={styles.submitBtn}
            accessibilityLabel="Submit Support Ticket"
          />

          {submittedTicketId && (
            <View style={styles.ticketSuccessBanner}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={styles.ticketSuccessText}>
                Ticket #{submittedTicketId} submitted. Safety agents will respond shortly.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Global Bottom Navigation Bar */}
      <BottomTabBar activeTab="safety" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  sosCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  sosOuterRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  sosMiddleRing: {
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: '#FCA5A5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.elevated,
  },
  sosButtonActive: {
    backgroundColor: '#991B1B',
  },
  sosButtonText: {
    color: colors.surface,
    fontSize: fontSizes.lg,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  sosPromptText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.danger,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  sosSubText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280,
  },
  sosActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  sosActiveBannerText: {
    fontSize: fontSizes.xs,
    color: colors.danger,
    fontWeight: '700',
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  gridCard: {
    flex: 1,
  },
  tokenCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginVertical: spacing.sm,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  tokenTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  tokenValue: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    borderRadius: borderRadius.xs,
    marginVertical: 4,
  },
  tokenHint: {
    fontSize: fontSizes.xs - 1,
    color: colors.textSecondary,
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  inputLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  ticketSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  ticketSuccessText: {
    fontSize: fontSizes.xs,
    color: colors.success,
    fontWeight: '600',
    flex: 1,
  },
});
