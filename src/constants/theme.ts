/**
 * Cores do app nos modos claro e escuro.
 * Use sempre `useTheme()` em vez de cores fixas nos componentes.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1F2328',
    textSecondary: '#5E6670',
    background: '#FBFAF8',
    backgroundElement: '#F1EEEA',
    backgroundSelected: '#E4DFD9',
    border: '#DDD7D0',
    primary: '#2F7D6D',
    onPrimary: '#FFFFFF',
    danger: '#B3261E',
    essencialBg: '#DDF0E8',
    essencialText: '#1E5C4D',
    utilBg: '#DCE9F7',
    utilText: '#1F4E7A',
    opcionalBg: '#ECE8F3',
    opcionalText: '#4F4466',
    evitarBg: '#FBE3DF',
    evitarText: '#8C2A1E',
  },
  dark: {
    text: '#F2F1EF',
    textSecondary: '#ABB2BA',
    background: '#121414',
    backgroundElement: '#1E2121',
    backgroundSelected: '#2A2E2E',
    border: '#343939',
    primary: '#6CC3AE',
    onPrimary: '#0B2620',
    danger: '#F2B8B5',
    essencialBg: '#173A31',
    essencialText: '#A6E3CF',
    utilBg: '#18304A',
    utilText: '#A9CCF0',
    opcionalBg: '#2C2738',
    opcionalText: '#CFC4E6',
    evitarBg: '#44201B',
    evitarText: '#F6B8AD',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 20,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 80 }) ?? 0;
export const MaxContentWidth = 800;
