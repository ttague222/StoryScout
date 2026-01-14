/**
 * StoryScout Theme
 *
 * Warm, readable typography and spacing
 * "Calm, parent-friendly UI" philosophy
 */

import { Platform } from 'react-native';

// Typography - warm, readable fonts
export const typography = {
  // Font families (system fonts that feel warm)
  fonts: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },

  // Font sizes - generous for easy reading
  sizes: {
    xs: 11,
    sm: 13,
    body: 16,
    bodyLarge: 18,
    subtitle: 20,
    title: 24,
    header: 28,
    hero: 34,
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },

  // Font weights
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Spacing system - generous whitespace
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius - soft, rounded corners
export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

// Shadows - subtle, warm
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Common component styles
export const commonStyles = {
  // Card style
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.md,
  },

  // Button styles
  buttonPrimary: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.full,
  },

  // Input styles
  input: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.body,
  },

  // Screen container
  screenContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
};

export default {
  typography,
  spacing,
  radii,
  shadows,
  commonStyles,
};
