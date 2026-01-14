/**
 * StoryScout Color Palette
 *
 * Calm, warm, parent-friendly colors
 * Inspired by children's book illustrations
 */

export const colors = {
  // Primary brand colors - warm and inviting
  primary: {
    main: '#5B7B6F',      // Sage green - calm, trustworthy
    light: '#7A9A8E',
    dark: '#3D5A4F',
    contrast: '#FFFFFF',
  },

  // Secondary accent - warm coral for CTAs
  accent: {
    main: '#E8A87C',      // Warm coral/peach
    light: '#F5C9A6',
    dark: '#D4845A',
    contrast: '#FFFFFF',
  },

  // Background colors - soft, easy on the eyes
  background: {
    primary: '#FBF9F7',   // Warm off-white (like book pages)
    secondary: '#F5F1ED', // Slightly warmer
    tertiary: '#EDE7E0',  // Card backgrounds
    card: '#FFFFFF',
  },

  // Text colors
  text: {
    primary: '#2D3436',   // Near black, easier to read than pure black
    secondary: '#636E72', // Muted for secondary info
    tertiary: '#95A5A6',  // Hints, placeholders
    inverse: '#FFFFFF',
    accent: '#5B7B6F',    // Links, highlights
  },

  // Mood colors (for mood selection)
  mood: {
    calm: '#A8D5BA',      // Soft green
    silly: '#FFD93D',     // Bright yellow
    adventurous: '#6BB3E0', // Sky blue
    emotional: '#DDA0DD', // Soft purple/plum
  },

  // Status colors
  status: {
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
    info: '#3498DB',
  },

  // UI elements
  border: '#E0D8D0',
  divider: '#EDE7E0',
  shadow: 'rgba(0, 0, 0, 0.08)',

  // Premium/subscription
  premium: {
    gold: '#D4A84B',
    goldLight: '#F5E6C8',
  },
};

export default colors;
