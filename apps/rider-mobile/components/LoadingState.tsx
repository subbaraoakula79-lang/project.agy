import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, fontSizes } from '../app/theme';

export interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  size?: 'small' | 'large';
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  subMessage,
  size = 'large',
  color = colors.primary,
  style,
}) => {
  return (
    <View style={[styles.container, style]} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size={size} color={color} style={styles.spinner} />
      <Text style={styles.message}>{message}</Text>
      {subMessage ? <Text style={styles.subMessage}>{subMessage}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: spacing.md,
  },
  message: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
