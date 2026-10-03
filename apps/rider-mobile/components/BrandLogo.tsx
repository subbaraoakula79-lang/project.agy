// apps/rider-mobile/components/BrandLogo.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

interface BrandLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'medium',
  showTagline = true,
}) => {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  const iconSize = isLarge ? 48 : isSmall ? 22 : 36;
  const titleSize = isLarge ? 32 : isSmall ? 18 : 26;
  const subtitleSize = isLarge ? 13 : isSmall ? 9 : 11;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { width: iconSize + 8, height: iconSize + 8 }]}>
        <Ionicons name="location" size={iconSize} color={colors.brandBlue} />
        <View
          style={[
            styles.innerBadge,
            {
              width: iconSize * 0.44,
              height: iconSize * 0.44,
              borderRadius: (iconSize * 0.44) / 2,
              top: iconSize * 0.2,
            },
          ]}
        >
          <Ionicons name="checkmark" size={iconSize * 0.3} color="#FFFFFF" />
        </View>
      </View>
      <Text style={[styles.brandTitle, { fontSize: titleSize }]}>
        Yatra<Text style={{ color: colors.brandGreen }}>Seva</Text>
      </Text>
      {showTagline && (
        <Text style={[styles.brandTagline, { fontSize: subtitleSize }]}>
          Safe Rides · Better Tomorrow
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  innerBadge: {
    position: 'absolute',
    backgroundColor: colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  brandTagline: {
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
