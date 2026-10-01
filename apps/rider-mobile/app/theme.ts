// apps/rider-mobile/app/theme.ts

export const colors = {
  background: '#F5F7FA', // near-white light gray
  surface: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#1E90FF', // professional blue
  primaryDark: '#0D5C99',
  primaryLight: '#EBF5FF',
  success: '#28A745', // green / pickup
  successLight: '#E8F5E9',
  warning: '#FFC107', // amber
  warningLight: '#FFF9C4',
  danger: '#DC3545', // red / drop / SOS
  dangerLight: '#FFEBEE',
  textPrimary: '#0D1A26', // dark navy
  textSecondary: '#6C757D', // muted blue-gray
  textMuted: '#94A3B8',
  divider: '#E0E0E0',
  border: '#E2E8F0',
  mapAccent: '#1E90FF',
  pickupMarker: '#28A745',
  dropMarker: '#DC3545',
  routeLine: '#1E90FF',
  overlay: 'rgba(13, 26, 38, 0.6)',
  badgeBg: '#F1F5F9',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  hero: 32,
};

export const shadows = {
  card: {
    shadowColor: '#0D1A26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#0D1A26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const dimensions = {
  minTouchTarget: 44,
  buttonHeight: 48,
  inputHeight: 48,
  headerHeight: 56,
};
