import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, dimensions, borderRadius } from '../app/theme';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotification?: boolean;
  onNotificationPress?: () => void;
  showProfile?: boolean;
  onProfilePress?: () => void;
  rightAction?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'YatraSeva',
  subtitle = 'Safe Rides • Better Tomorrow',
  showBack = false,
  onBack,
  showNotification = true,
  onNotificationPress,
  showProfile = true,
  onProfilePress,
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

  const handleProfile = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push('/profile');
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
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.brandIconContainer} accessibilityLabel="YatraSeva Brand Pin">
              <Ionicons name="navigate-circle" size={28} color={colors.primary} />
            </View>
          )}

          <View style={styles.titleColumn}>
            <Text style={styles.brandTitle} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.brandSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rightSection}>
          {rightAction ? (
            rightAction
          ) : (
            <>
              {showNotification && (
                <TouchableOpacity
                  onPress={onNotificationPress}
                  style={styles.iconButton}
                  accessibilityLabel="Notifications"
                  accessibilityRole="button"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
                  <View style={styles.notificationDot} />
                </TouchableOpacity>
              )}

              {showProfile && (
                <TouchableOpacity
                  onPress={handleProfile}
                  style={styles.profileButton}
                  accessibilityLabel="View Profile"
                  accessibilityRole="button"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="person-circle-outline" size={26} color={colors.textPrimary} />
                </TouchableOpacity>
              )}
            </>
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ? StatusBar.currentHeight / 2 : 8) : 8,
  },
  container: {
    minHeight: dimensions.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandIconContainer: {
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleColumn: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: -1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: dimensions.minTouchTarget,
    height: dimensions.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    position: 'relative',
  },
  profileButton: {
    width: dimensions.minTouchTarget,
    height: dimensions.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
});
