/**
 * Charte de Couleurs Centralisée
 * Bleu, Blanc, Noir - Sans Gradients
 */

export const colors = {
  // PRIMARY COLORS
  primary: {
    blue: '#2563EB',      // Bleu vif - appels à l'action
    blueLight: '#3B82F6', // Bleu clair - éléments sélectionnés/hover
    blueDark: '#1E40AF',  // Bleu foncé - textes importants
    navy: '#0F172A',      // Bleu très foncé - backgrounds
  },

  // NEUTRALS
  neutral: {
    white: '#FFFFFF',     // Fond principal
    lightGray: '#F8FAFC', // Backgrounds secondaires
    mediumGray: '#CBD5E1',// Borders, séparateurs
    darkGray: '#475569',  // Textes
    black: '#1F2937',     // Textes principaux, titres
  },

  // SEMANTIC
  semantic: {
    success: '#10B981',   // Vert - alertes ok
    warning: '#F59E0B',   // Orange - avertissements
    danger: '#EF4444',    // Rouge - erreurs/critiques
    info: '#0EA5E9',      // Cyan - infos
  },

  // BACKGROUNDS
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
    dark: '#0F172A',
    darkSecondary: '#1E293B',
  },

  // TEXT
  text: {
    primary: '#1F2937',
    secondary: '#475569',
    tertiary: '#64748B',
    light: '#CBD5E1',
    white: '#FFFFFF',
    dark: '#0F172A',
  },

  // BORDERS
  border: {
    light: '#E2E8F0',
    medium: '#CBD5E1',
    dark: '#94A3B8',
  },

  // SHADOWS
  shadow: {
    sm: 'rgba(0, 0, 0, 0.05)',
    md: 'rgba(0, 0, 0, 0.1)',
    lg: 'rgba(0, 0, 0, 0.15)',
  },

  // HOVER STATES
  hover: {
    primary: '#1E40AF',   // Bleu foncé
    secondary: '#E0E7FF', // Bleu très clair
    danger: '#DC2626',    // Rouge plus foncé
    success: '#059669',   // Vert plus foncé
  },

  // SPECIFIC USE CASES
  alert: {
    successBg: '#D1FAE5',
    successText: '#065F46',
    warningBg: '#FEF3C7',
    warningText: '#92400E',
    dangerBg: '#FEE2E2',
    dangerText: '#991B1B',
    infoBg: '#CFFAFE',
    infoText: '#164E63',
  },

  // SIDEBAR
  sidebar: {
    background: '#0F172A',
    backgroundGradientStart: '#1E293B',
    backgroundGradientEnd: '#0F172A',
    text: '#FFFFFF',
    textHover: '#FFFFFF',
    textMuted: '#CBD5E1',
    border: 'rgba(255, 255, 255, 0.1)',
    activeBackground: '#2563EB',
    activeText: '#FFFFFF',
    hoverBackground: 'rgba(255, 255, 255, 0.08)',
  },

  // CARDS
  card: {
    background: '#FFFFFF',
    backgroundHover: '#F8FAFC',
    border: '#E2E8F0',
    borderHover: '#2563EB',
    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowHover: 'rgba(0, 0, 0, 0.12)',
  },

  // BUTTONS
  button: {
    primary: '#2563EB',
    primaryText: '#FFFFFF',
    primaryHover: '#1E40AF',
    secondary: '#F8FAFC',
    secondaryText: '#1F2937',
    secondaryHover: '#E2E8F0',
    danger: '#EF4444',
    dangerHover: '#DC2626',
    success: '#10B981',
    successHover: '#059669',
  },

  // INPUTS
  input: {
    background: '#FFFFFF',
    backgroundDisabled: '#F8FAFC',
    border: '#E2E8F0',
    borderFocus: '#2563EB',
    borderError: '#EF4444',
    text: '#1F2937',
    textPlaceholder: '#94A3B8',
  },

  // OPACITY VARIANTS
  opacity: {
    10: 'rgba(37, 99, 235, 0.1)', // Blue with 10% opacity
    20: 'rgba(37, 99, 235, 0.2)',
    30: 'rgba(37, 99, 235, 0.3)',
  },
} as const;

// Type for color keys
export type ColorKey = keyof typeof colors;
