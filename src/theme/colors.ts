/**
 * Color tokens – mirrors tailwind.config.js for use in StyleSheet / imperative code.
 */
export const Colors = {
  bgPurple: '#4B0082',       // Roxo profundo nas extremidades
  brandBlue: '#2D3ED2',      // Azul vibrante sólido para os cards
  cardBlue: '#2D3ED2',       // Alias para brandBlue
  cardGrid: '#5B6EF5',
  glass: 'rgba(255,255,255,0.20)', // Opacidade 0.20
  glassBorder: 'rgba(255,255,255,0.25)',

  // Gradient stops: Roxo profundo (#4B0082) -> Azul iluminado (#4A6CF7)
  gradientStart: '#4A6CF7',   // Illuminado azul central
  gradientMiddle: '#3B006D',  // Mid purple
  gradientEnd: '#4B0082',     // Deep purple corners

  white: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  inputBg: 'rgba(255,255,255,0.20)',
  inputPlaceholder: 'rgba(255,255,255,0.6)',
  sendButton: '#FFFFFF',      // Seta branca para destaque no azul
} as const;

