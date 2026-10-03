// apps/rider-mobile/app/profile.tsx
import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, borderRadius, shadows } from '../theme';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { BottomTabBar } from '../components/BottomTabBar';

export default function RiderProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  // Guard: if not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const handleAction = (feature: string) => {
    if (feature === 'My Rides') {
      router.push('/history');
      return;
    }
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
          onPress: () => {
            logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Profile"
        showBack={true}
        onBack={() => router.replace('/')}
        rightAction={
          <TouchableOpacity
            style={styles.gearButton}
            onPress={() => handleAction('Settings')}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Card matching Reference Screen 13 */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{user?.name || 'Priya Sharma'}</Text>
            <Text style={styles.profilePhone}>{user?.phone || '+91 98765 43210'}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#15803D" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Menu Rows matching Reference Screen 13 */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleAction('My Rides')}
            accessibilityRole="button"
          >
            <View style={styles.menuLeft}>
              <Ionicons name="car-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.menuTitle}>My Rides</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleAction('My Wallet')}
            accessibilityRole="button"
          >
            <View style={styles.menuLeft}>
              <Ionicons name="wallet-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.menuTitle}>My Wallet</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.walletAmount}>₹{user?.walletBalance ?? 248}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleAction('Saved Addresses')}
            accessibilityRole="button"
          >
            <View style={styles.menuLeft}>
              <Ionicons name="location-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.menuTitle}>Saved Addresses</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleAction('Help & Support')}
            accessibilityRole="button"
          >
            <View style={styles.menuLeft}>
              <Ionicons name="help-circle-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.menuTitle}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleAction('Settings')}
            accessibilityRole="button"
          >
            <View style={styles.menuLeft}>
              <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.menuTitle}>Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={() => handleAction('About YatraSeva')}
            accessibilityRole="button"
          >
            <View style={styles.menuLeft}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textPrimary} />
              <Text style={styles.menuTitle}>About YatraSeva</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Bottom Safety & Trust Card matching Reference Screen 13 */}
        <View style={styles.trustCard}>
          <View style={styles.trustIconCircle}>
            <Ionicons name="shield-checkmark" size={24} color={colors.brandGreen} />
          </View>
          <View style={styles.trustTextColumn}>
            <Text style={styles.trustTitle}>Safe Rides</Text>
            <Text style={styles.trustSub}>Better Tomorrow</Text>
          </View>
        </View>

        {/* Log Out Option */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out of account"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomTabBar activeTab="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gearButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  profilePhone: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: 6,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  menuContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuTitle: {
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  walletAmount: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  trustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  trustIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTextColumn: {
    justifyContent: 'center',
  },
  trustTitle: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: '#166534',
  },
  trustSub: {
    fontSize: fontSizes.xs,
    color: '#15803D',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: spacing.xs,
  },
  logoutText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.danger,
  },
});
