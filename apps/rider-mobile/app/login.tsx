// apps/rider-mobile/app/login.tsx
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

export default function RiderLoginScreen() {
  const router = useRouter();
  const { isAuthenticated, tempPhone, setTempPhone } = useAuth();

  const [phoneDigits, setPhoneDigits] = useState(
    tempPhone ? tempPhone.replace('+91', '').trim() : '9000000001'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleSendOtp = () => {
    setError('');
    const cleanDigits = phoneDigits.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    setTempPhone(`+91 ${cleanDigits}`);

    setTimeout(() => {
      setLoading(false);
      router.push('/otp');
    }, 350);
  };

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
              onPress={() => router.replace('/')}
              style={styles.backButton}
              accessibilityLabel="Go back to welcome"
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
          </View>

          {error ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={18} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Phone Input Box matching Reference Screen 3 */}
          <View style={styles.phoneInputContainer}>
            <View style={styles.prefixBlock}>
              <Text style={styles.prefixText}>+91</Text>
              <View style={styles.prefixDivider} />
            </View>
            <TextInput
              style={styles.textInput}
              value={phoneDigits}
              onChangeText={(text) => {
                setPhoneDigits(text.replace(/\D/g, '').slice(0, 10));
                if (error) setError('');
              }}
              placeholder="Enter mobile number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              accessibilityLabel="10-digit mobile number input"
            />
          </View>

          {/* Send OTP Primary Button */}
          <PrimaryButton
            title="Send OTP"
            onPress={handleSendOtp}
            loading={loading}
            style={styles.sendOtpButton}
            accessibilityLabel="Send OTP verification button"
          />

          {/* Social Login Section */}
          <View style={styles.socialDividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsRow}>
            <TouchableOpacity
              style={styles.socialCard}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              onPress={() => handleSendOtp()}
            >
              <Ionicons name="logo-google" size={22} color="#EA4335" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialCard}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Continue with Apple"
              onPress={() => handleSendOtp()}
            >
              <Ionicons name="logo-apple" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Footer Terms */}
          <View style={styles.footerSection}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{'\n'}
              <Text style={styles.footerLink}>Terms of Service & Privacy Policy</Text>
            </Text>
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
    justifyContent: 'space-between',
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
    marginBottom: spacing.xl,
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
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: dimensions.inputHeight,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  prefixBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefixText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  prefixDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  sendOtpButton: {
    height: dimensions.buttonHeight,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    marginBottom: spacing.xl,
  },
  socialDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    fontWeight: '500',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginVertical: spacing.md,
  },
  socialCard: {
    width: 64,
    height: 52,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  footerSection: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
