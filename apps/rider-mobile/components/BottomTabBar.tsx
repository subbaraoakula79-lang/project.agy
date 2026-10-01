import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSizes, dimensions, shadows } from '../app/theme';

export type TabKey = 'home' | 'rides' | 'safety' | 'profile';

export interface BottomTabBarProps {
  activeTab: TabKey;
  onTabPress?: (tab: TabKey) => void;
}

interface TabItemConfig {
  key: TabKey;
  label: string;
  route: string;
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
  iconInactive: React.ComponentProps<typeof Ionicons>['name'];
}

const TABS: TabItemConfig[] = [
  {
    key: 'home',
    label: 'Home',
    route: '/',
    iconActive: 'home',
    iconInactive: 'home-outline',
  },
  {
    key: 'rides',
    label: 'Rides',
    route: '/history',
    iconActive: 'receipt',
    iconInactive: 'receipt-outline',
  },
  {
    key: 'safety',
    label: 'Safety',
    route: '/safety',
    iconActive: 'shield-checkmark',
    iconInactive: 'shield-checkmark-outline',
  },
  {
    key: 'profile',
    label: 'Profile',
    route: '/profile',
    iconActive: 'person',
    iconInactive: 'person-outline',
  },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  const router = useRouter();

  const handlePress = (tab: TabItemConfig) => {
    if (onTabPress) {
      onTabPress(tab.key);
    }
    if (activeTab !== tab.key) {
      router.replace(tab.route as any);
    }
  };

  return (
    <View
      style={styles.container}
      accessibilityRole="tablist"
      accessibilityLabel="Bottom navigation tabs"
    >
      <View style={styles.tabsRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const iconName = isActive ? tab.iconActive : tab.iconInactive;
          const color = isActive ? colors.primary : colors.textSecondary;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => handlePress(tab)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityLabel={`${tab.label} tab`}
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name={iconName} size={22} color={color} />
                {isActive && <View style={styles.activeDot} />}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color },
                  isActive && styles.activeTabLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 6,
    ...shadows.card,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    minHeight: dimensions.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: fontSizes.xs - 1,
    fontWeight: '500',
    marginTop: 2,
  },
  activeTabLabel: {
    fontWeight: '700',
  },
  activeDot: {
    position: 'absolute',
    bottom: -3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
