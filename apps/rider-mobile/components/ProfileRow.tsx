import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, dimensions } from '../app/theme';

export interface ProfileRowProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  isDestructive?: boolean;
  showChevron?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ProfileRow: React.FC<ProfileRowProps> = ({
  iconName,
  title,
  subtitle,
  value,
  onPress,
  isDestructive = false,
  showChevron = true,
  style,
}) => {
  const iconColor = isDestructive ? colors.danger : colors.textPrimary;
  const textColor = isDestructive ? colors.danger : colors.textPrimary;

  return (
    <TouchableOpacity
      style={[styles.row, style]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${title} ${value || subtitle || ''}`}
    >
      <View style={styles.leftCol}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.rightCol}>
        {value ? <Text style={styles.value}>{value}</Text> : null}
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
            style={styles.chevron}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: dimensions.minTouchTarget + 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    fontSize: fontSizes.sm,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  chevron: {
    marginLeft: 4,
  },
});
