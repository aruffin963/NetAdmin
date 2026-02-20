/**
 * Mappings pour la migration des couleurs hardcodées vers la charte centralisée
 * Utilisez cette référence pour remplacer les couleurs dans tous les fichiers
 */

export const colorMappings = {
  // REPLACEMENTS COURANTS
  backgrounds: {
    '#f8fafc': 'colors.background.secondary',
    '#f1f5f9': 'colors.background.tertiary',
    '#f0f4f8': 'colors.background.tertiary',
    '#d9e2ec': 'colors.background.tertiary',
    'white': 'colors.background.primary',
    '#ffffff': 'colors.background.primary',
    '#0f172a': 'colors.background.dark',
    '#1e293b': 'colors.sidebar.background',
  },

  // TEXTES
  texts: {
    '#000000': 'colors.text.primary',
    '#1f2937': 'colors.text.primary',
    '#1a202c': 'colors.text.primary',
    '#0f172a': 'colors.text.dark',
    '#475569': 'colors.text.secondary',
    '#64748b': 'colors.text.tertiary',
    '#6b7280': 'colors.text.secondary',
    '#94a3b8': 'colors.text.tertiary',
    '#cbd5e1': 'colors.border.light',
    '#2d3748': 'colors.text.primary',
    'white': 'colors.text.white',
    '#ffffff': 'colors.text.white',
  },

  // COULEURS PRIMAIRES
  primary_blue: {
    '#60a5fa': 'colors.primary.blueLight',
    '#3b82f6': 'colors.primary.blueLight',
    '#2563eb': 'colors.primary.blue',
    '#1e40af': 'colors.primary.blueDark',
    '#0066ff': 'colors.primary.blue',
  },

  // COULEURS SÉMANTIQUES
  semantic: {
    '#10b981': 'colors.semantic.success',
    '#059669': 'colors.hover.success',
    '#f59e0b': 'colors.semantic.warning',
    '#ef4444': 'colors.semantic.danger',
    '#dc2626': 'colors.hover.danger',
    '#0ea5e9': 'colors.semantic.info',
  },

  // BORDERS ET SEPARATEURS
  borders: {
    '#e2e8f0': 'colors.border.light',
    '#e5e7eb': 'colors.border.light',
    '#cbd5e1': 'colors.border.medium',
    '#94a3b8': 'colors.border.dark',
  },

  // STATES
  states: {
    // Active/Hover
    'rgba(16, 185, 129, 0.2)': 'colors.opacity[20]',
    'rgba(16, 185, 129, 0.3)': 'colors.opacity[30]',
    'rgba(107, 114, 128, 0.2)': 'rgba(107, 114, 128, 0.2)',
    'rgba(37, 99, 235, 0.1)': 'colors.opacity[10]',
    'rgba(37, 99, 235, 0.2)': 'colors.opacity[20]',
    'rgba(37, 99, 235, 0.3)': 'colors.opacity[30]',
    // Danger/Error
    '#fee2e2': 'colors.alert.dangerBg',
    '#fecaca': 'colors.alert.dangerBg',
    '#991b1b': 'colors.alert.dangerText',
    // Warning
    '#fef3c7': 'colors.alert.warningBg',
    '#92400e': 'colors.alert.warningText',
    // Success
    '#d1fae5': 'colors.alert.successBg',
    '#a7f3d0': 'colors.alert.successBg',
    '#065f46': 'colors.alert.successText',
  },

  // GRADIENTS À REMPLACER (NON UTILISÉE - couleurs solides seulement)
  gradients_to_remove: {
    'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)': 'colors.background.secondary',
    'linear-gradient(135deg, #f0f4f8 0%, #d9e2ec 100%)': 'colors.background.tertiary',
    'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)': 'colors.primary.blue',
    'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)': 'colors.primary.blue',
    'linear-gradient(135deg, #3b82f6, #2563eb)': 'colors.primary.blue',
    'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)': 'colors.primary.blue',
    'linear-gradient(135deg, #60a5fa 0%, #34d399 100%)': 'colors.primary.blue',
    'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)': 'colors.sidebar.background',
  },
};

/**
 * Remplacements à faire dans TOUS les styled components:
 * 
 * 1. En haut de chaque fichier:
 *    import { colors } from '../config/colors';
 * 
 * 2. Remplacer les couleurs selon les mappings ci-dessus
 *    Ex: background: #f8fafc; → background: ${colors.background.secondary};
 * 
 * 3. Remplacer les gradients par les couleurs solides
 *    Ex: background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
 *        → background: ${colors.primary.blue};
 * 
 * 4. Utilis rgba() avec colors.opacity
 *    Ex: box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3);
 *        → box-shadow: 0 4px 15px ${colors.opacity[30]};
 */
