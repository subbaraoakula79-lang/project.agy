
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, shadows } from './theme';
import { AppHeader } from '../components/AppHeader';
import { ProfileRow } from '../components/ProfileRow';
import { SectionHeader } from '../components/SectionHeader';
import { BottomTabBar } from '../components/BottomTabBar';

export default function RiderProfileScreen() {
  const router = useRouter();

  const handleAction = (feature: string) => {
    Alert.alert(feature, `${feature} options will be available in the upcoming release.`);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of YatraSeva?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => router.replace('/'),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Profile"
        subtitle="Manage your YatraSeva account"
        showBack={true}
        onBack={() => router.replace('/')}
        showNotification={false}
        showProfile={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={36} color={colors.surface} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Priya Sharma</Text>
            <Text style={styles.userPhone}>+91 90000 00001</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.verifiedText}>Verified Rider</Text>
            </View>
          </View>
        </View>

        {/* SECTION 1: ACCOUNT */}
        <SectionHeader title="ACCOUNT" style={styles.sectionHeader} />
        <View style={styles.groupCard}>
          <ProfileRow
            iconName="receipt-outline"
            title="My Rides"
            subtitle="View past trips & invoices"
            onPress={() => router.push('/history')}
          />
          <ProfileRow
            iconName="wallet-outline"
            title="My Wallet"
            subtitle="YatraSeva cash & credits"
            value="₹248"
            onPress={() => handleAction('My Wallet')}
          />
          <ProfileRow
            iconName="location-outline"
            title="Saved Addresses"
            subtitle="Home, Work, Beach Road"
            onPress={() => handleAction('Saved Addresses')}
          />
          <ProfileRow
            iconName="card-outline"
            title="Payment Methods"
            subtitle="UPI, Cards, Cash"
            onPress={() => handleAction('Payment Methods')}
          />
        </View>

        {/* SECTION 2: PREFERENCES */}
        <SectionHeader title="PREFERENCES" style={styles.sectionHeader} />
        <View style={styles.groupCard}>
          <ProfileRow
            iconName="notifications-outline"
            title="Notifications"
            subtitle="Ride updates & promotional offers"
            onPress={() => handleAction('Notifications')}
          />
          <ProfileRow
            iconName="language-outline"
            title="App Language"
            value="English (Telugu available)"
            onPress={() => handleAction('App Language')}
          />
          <ProfileRow
            iconName="settings-outline"
            title="App Preferences"
            subtitle="Theme, sound alerts, accessibility"
            onPress={() => handleAction('App Preferences')}
          />
        </View>

        {/* SECTION 3: SAFETY */}
        <SectionHeader title="SAFETY & SUPPORT" style={styles.sectionHeader} />
        <View style={styles.groupCard}>
          <ProfileRow
            iconName="shield-checkmark-outline"
            title="Emergency Contacts"
            subtitle="Manage trusted contacts for SOS"
            onPress={() => router.push('/safety')}
          />
          <ProfileRow
            iconName="help-circle-outline"
            title="Help & Support"
            subtitle="24x7 customer assistance"
            onPress={() => router.push('/safety')}
          />
          <ProfileRow
            iconName="information-circle-outline"
            title="About YatraSeva"
            subtitle="Version 1.0.0 • Kakinada, AP"
            onPress={() => handleAction('About YatraSeva')}
          />
        </View>

        {/* Brand Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconCircle}>
            <Ionicons name="shield-checkmark" size={24} color={colors.success} />
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Safe Rides • Better Tomorrow</Text>
            <Text style={styles.bannerSub}>Kakinada's premier community mobility platform</Text>
          </View>
        </View>

        {/* SECTION 4: ACCOUNT ACTIONS */}
        <SectionHeader title="ACCOUNT ACTIONS" style={styles.sectionHeader} />
        <View style={styles.groupCard}>
          <ProfileRow
            iconName="log-out-outline"
            title="Log Out"
            subtitle="Sign out from this device"
            isDestructive={true}
            showChevron={false}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      {/* Global Bottom Navigation Bar */}
      <BottomTabBar activeTab="profile" />
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    ...shadows.button,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userPhone: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  verifiedText: {
    fontSize: fontSizes.xs,
    color: colors.success,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  bannerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: '#22543D',
  },
  bannerSub: {
    fontSize: fontSizes.xs,
    color: '#276749',
    marginTop: 2,
  },
});
