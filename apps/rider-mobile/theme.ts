// apps/rider-mobile/theme.ts

export const colors = {
  background: '#F8FAFC', // very light gray/blue background matching reference
  surface: '#FFFFFF',
  card: '#FFFFFF',
  primary: '#1E88E5', // vibrant professional blue from reference CTA buttons
  primaryDark: '#1565C0',
  primaryLight: '#E3F2FD',
  success: '#10B981', // vibrant emerald green from reference (pickup pin, driver arriving, completed)
  successDark: '#059669',
  successLight: '#DCFCE7',
  warning: '#F59E0B', // amber
  warningLight: '#FEF3C7',
  danger: '#EF4444', // red (drop pin, SOS)
  dangerDark: '#DC2626',
  dangerLight: '#FEE2E2',
  textPrimary: '#0F172A', // deep navy from reference
  textSecondary: '#64748B', // slate muted text
  textMuted: '#94A3B8',
  divider: '#E2E8F0',
  border: '#E2E8F0',
  brandBlue: '#0284C7',
  brandGreen: '#10B981',
  mapAccent: '#1E88E5',
  mapWater: '#BAE6FD',
  mapLand: '#F1F5F9',
  pickupMarker: '#10B981',
  dropMarker: '#EF4444',
  routeLine: '#1E88E5',
  overlay: 'rgba(15, 23, 42, 0.6)',
  badgeBg: '#F1F5F9',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 40 };

export const borderRadius = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };

export const fontSizes = { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 26, hero: 32 };

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  button: {
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const dimensions = { minTouchTarget: 44, buttonHeight: 50, inputHeight: 50, headerHeight: 56 };
