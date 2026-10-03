// apps/rider-mobile/app/otp.tsx
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, shadows, dimensions } from '../theme';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from '../components/BrandLogo';
import { PrimaryButton } from '../components/PrimaryButton';

export default function RiderOtpScreen() {
  const router = useRouter();
  const { isAuthenticated, tempPhone, login } = useAuth();

  const [otp, setOtp] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleVerifyOtp = () => {
    setError('');
    if (otp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (otp === '123456') {
        login({
          id: 'rider-001',
          name: 'Priya Sharma',
          phone: tempPhone || '+91 90000 00001',
          role: 'RIDER',
          walletBalance: 248,
        });
        router.replace('/');
      } else {
        setError('Invalid OTP code. Please enter the test code: 123456');
      }
    }, 400);
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setError('');
    setOtp('123456');
    setResendTimer(30);
  };

  const otpArray = (otp + '      ').slice(0, 6).split('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Back Arrow */}
          <View style={styles.topNavRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityLabel="Go back to mobile number"
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Centered Brand Logo */}
          <View style={styles.logoSection}>
            <BrandLogo size="medium" showTagline={true} />
          </View>

          {/* Heading & Subtext */}
          <View style={styles.headingSection}>
            <Text style={styles.mainHeading}>Verify Your Mobile Number</Text>
            <Text style={styles.subHeading}>
              We'll send you a 6 digit OTP to this number
            </Text>
            <Text style={styles.phoneBadge}>{tempPhone || '+91 90000 00001'}</Text>
          </View>

          {/* Dev Hint Box */}
          <View style={styles.devHintBox}>
            <Ionicons name="information-circle" size={16} color={colors.primary} />
            <Text style={styles.devHintText}>Development Test OTP: 123456</Text>
          </View>

          {error ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* 6 Digit OTP Display Boxes */}
          <View style={styles.otpBoxesRow}>
            {otpArray.map((digit, index) => {
              const isFilled = digit.trim().length > 0;
              const isCurrent = otp.length === index;
              return (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    isFilled && styles.otpBoxFilled,
                    isCurrent && styles.otpBoxActive,
                  ]}
                >
                  <Text style={styles.otpDigitText}>{digit.trim()}</Text>
                </View>
              );
            })}
          </View>

          {/* Hidden/Direct Input for keyboard control */}
          <TextInput
            style={styles.hiddenInput}
            value={otp}
            onChangeText={(text) => {
              setOtp(text.replace(/\D/g, '').slice(0, 6));
              if (error) setError('');
            }}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus={true}
            accessibilityLabel="Enter 6-digit OTP code"
          />

          {/* Resend OTP Row */}
          <View style={styles.resendRow}>
            {resendTimer > 0 ? (
              <Text style={styles.resendTimerText}>
                Resend OTP in <Text style={styles.timerBold}>{resendTimer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleResend}
                accessibilityRole="button"
                accessibilityLabel="Resend OTP"
              >
                <Text style={styles.resendActiveText}>
                  Didn't receive code? <Text style={styles.resendLink}>Resend OTP</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Verify & Continue Button */}
          <PrimaryButton
            title="Verify & Continue"
            onPress={handleVerifyOtp}
            loading={loading}
            style={styles.verifyButton}
            accessibilityLabel="Verify OTP and proceed"
          />

          {/* Bottom Security Note */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
            <Text style={styles.securityText}>100% Secure Verification</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  topNavRow: {
    height: 44,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  mainHeading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subHeading: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  phoneBadge: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  devHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    alignSelf: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  devHintText: {
    fontSize: fontSizes.xs,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSizes.sm,
    fontWeight: '500',
    flex: 1,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.lg,
    gap: spacing.xs,
  },
  otpBox: {
    flex: 1,
    height: 54,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: '#F0F9FF',
  },
  otpBoxActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  otpDigitText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  resendRow: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  resendTimerText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  timerBold: {
    fontWeight: '700',
    color: colors.primary,
  },
  resendActiveText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '700',
  },
  verifyButton: {
    height: dimensions.buttonHeight,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  securityText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
