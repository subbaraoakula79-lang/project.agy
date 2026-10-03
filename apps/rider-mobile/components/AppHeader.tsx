// apps/rider-mobile/components/AppHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, dimensions, borderRadius } from '../theme';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;

  showNotification?: boolean;
  onNotificationPress?: () => void;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'YatraSeva',
  subtitle = 'Safe Rides · Better Tomorrow',
  showBack = false,
  onBack,

  showNotification = false,
  onNotificationPress,
  showLogo = false,
  rightAction,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.safeContainer} accessibilityRole="header">
      <View style={styles.container}>
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.iconButton}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>

        <View style={styles.centerSection}>
          {showLogo ? (
            <View style={styles.brandRow}>
              <View style={styles.logoPinCircle}>
                <Ionicons name="location" size={18} color={colors.brandBlue} />
                <View style={styles.logoPinInner}>
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.brandTextColumn}>
                <Text style={styles.brandName}>
                  Yatra<Text style={{ color: colors.brandGreen }}>Seva</Text>
                </Text>
                <Text style={styles.brandTagline}>Safe Rides · Better Tomorrow</Text>
              </View>
            </View>
          ) : (
            <View style={styles.titleColumn}>
              <Text style={styles.screenTitle} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={styles.screenSubtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.rightSection}>
          {rightAction ? (
            rightAction
          ) : showNotification ? (
            <TouchableOpacity
              onPress={onNotificationPress}
              style={styles.iconButton}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 4 : 0,
  },
  container: {
    height: dimensions.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  leftSection: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoPinCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoPinInner: {
    position: 'absolute',
    top: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextColumn: {
    alignItems: 'center',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.1,
  },
  titleColumn: {
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
