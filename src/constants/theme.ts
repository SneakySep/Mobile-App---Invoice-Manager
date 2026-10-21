import { MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import type { AppIconName } from '../types/icons';
import type { PaymentStatus } from '../types/invoice';

/** Brand palette shared by the UI and the invoice PDF. */
export const BRAND = {
  primary: '#0B6B63',
  primaryDark: '#054B46',
  primaryLight: '#D4F1EB',
  mint: '#E7F6F2',
  accent: '#B45309',
  background: '#F4F7F6',
  surface: '#FFFFFF',
  text: '#172622',
  muted: '#5E706B',
  border: '#DCE6E2',
  success: '#15803D',
  warning: '#B45309',
  danger: '#B42318',
} as const;

export const appTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: BRAND.primary,
    onPrimary: '#FFFFFF',
    primaryContainer: BRAND.primaryLight,
    onPrimaryContainer: '#00211D',
    secondary: '#4D635E',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D5E8E2',
    onSecondaryContainer: '#0A1F1B',
    tertiary: '#825500',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FFDEA8',
    onTertiaryContainer: '#2A1700',
    background: BRAND.background,
    onBackground: BRAND.text,
    surface: BRAND.surface,
    onSurface: BRAND.text,
    surfaceVariant: '#E1E9E5',
    onSurfaceVariant: BRAND.muted,
    outline: '#71807B',
    outlineVariant: BRAND.border,
    error: BRAND.danger,
    onError: '#FFFFFF',
    errorContainer: '#FFDAD5',
    onErrorContainer: '#410002',
    inverseSurface: '#2B322F',
    inverseOnSurface: '#ECF2EF',
    inversePrimary: '#7CD8C8',
    shadow: '#000000',
    scrim: '#000000',
    surfaceDisabled: 'rgba(23, 38, 34, 0.12)',
    onSurfaceDisabled: 'rgba(23, 38, 34, 0.38)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    elevation: {
      level0: 'transparent',
      level1: '#F8FBF9',
      level2: '#F2F7F5',
      level3: '#ECF3F0',
      level4: '#E9F1EE',
      level5: '#E5EEEB',
    },
  },
};

export interface StatusMeta {
  label: string;
  background: string;
  foreground: string;
  border: string;
  icon: AppIconName;
}

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta> = {
  paid: {
    label: 'PAID',
    background: '#DCFCE7',
    foreground: '#166534',
    border: '#A7E3BA',
    icon: 'check-decagram-outline',
  },
  partial: {
    label: 'PARTIAL',
    background: '#FEF3C7',
    foreground: '#92400E',
    border: '#F3D48A',
    icon: 'progress-clock',
  },
  unpaid: {
    label: 'UNPAID',
    background: '#FEE2E2',
    foreground: '#991B1B',
    border: '#F4B4B4',
    icon: 'alert-circle-outline',
  },
};
