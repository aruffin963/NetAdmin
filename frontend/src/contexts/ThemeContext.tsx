import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TenantTheme, TenantSettings, DEFAULT_THEMES } from '../../../shared/src/types/tenant';

// === CONTEXT ===

interface ThemeContextType {
  currentTheme: TenantTheme;
  availableThemes: TenantTheme[];
  isDarkMode: boolean;
  setTheme: (theme: TenantTheme) => void;
  setDarkMode: (enabled: boolean) => void;
  applyCustomColors: (colors: Partial<TenantTheme['colors']>) => void;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// === HOOK ===

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// === PROVIDER ===

interface ThemeProviderProps {
  children: ReactNode;
  tenantSettings?: TenantSettings;
  defaultTheme?: TenantTheme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  tenantSettings,
  defaultTheme
}) => {
  // État du thème actuel
  const [currentTheme, setCurrentTheme] = useState<TenantTheme>(
    tenantSettings?.theme || defaultTheme || DEFAULT_THEMES[0]
  );
  
  // Thèmes disponibles (défaut + custom du tenant)
  const [availableThemes, setAvailableThemes] = useState<TenantTheme[]>(
    DEFAULT_THEMES
  );
  
  // Mode sombre
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    tenantSettings?.preferences?.enableDarkMode || false
  );

  // Appliquer le thème au DOM
  useEffect(() => {
    applyThemeToDOM(currentTheme, isDarkMode);
  }, [currentTheme, isDarkMode]);

  // Charger les thèmes custom du tenant
  useEffect(() => {
    if (tenantSettings?.theme) {
      setAvailableThemes(prev => {
        const filtered = prev.filter(t => t.id !== tenantSettings.theme.id);
        return [...filtered, tenantSettings.theme];
      });
    }
  }, [tenantSettings]);

  // === MÉTHODES ===

  const setTheme = (theme: TenantTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('netadmin-theme', JSON.stringify(theme));
  };

  const setDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
    localStorage.setItem('netadmin-dark-mode', enabled.toString());
  };

  const applyCustomColors = (colors: Partial<TenantTheme['colors']>) => {
    const updatedTheme: TenantTheme = {
      ...currentTheme,
      colors: {
        ...currentTheme.colors,
        ...colors
      }
    };
    setTheme(updatedTheme);
  };

  const resetToDefault = () => {
    setTheme(DEFAULT_THEMES[0]);
    setDarkMode(false);
  };

  const value: ThemeContextType = {
    currentTheme,
    availableThemes,
    isDarkMode,
    setTheme,
    setDarkMode,
    applyCustomColors,
    resetToDefault
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// === UTILITAIRES ===

/**
 * Applique le thème actuel au DOM via des variables CSS custom
 */
function applyThemeToDOM(theme: TenantTheme, isDarkMode: boolean) {
  const root = document.documentElement;
  
  // Couleurs de base
  const colors = isDarkMode ? getDarkModeColors(theme.colors) : theme.colors;
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${kebabCase(key)}`, value);
  });
  
  // Typographie
  Object.entries(theme.typography.fontSizes).forEach(([key, value]) => {
    root.style.setProperty(`--font-size-${key}`, value);
  });
  
  Object.entries(theme.typography.fontWeights).forEach(([key, value]) => {
    root.style.setProperty(`--font-weight-${key}`, value.toString());
  });
  
  Object.entries(theme.typography.lineHeights).forEach(([key, value]) => {
    root.style.setProperty(`--line-height-${key}`, value.toString());
  });
  
  // Famille de polices
  root.style.setProperty('--font-family', theme.typography.fontFamily);
  root.style.setProperty('--font-family-mono', theme.typography.fontFamilyMono);
  
  // Espacements
  Object.entries(theme.spacing).forEach(([key, value]) => {
    root.style.setProperty(`--spacing-${key}`, value);
  });
  
  // Composants
  Object.entries(theme.components.button).forEach(([key, value]) => {
    root.style.setProperty(`--button-${kebabCase(key)}`, value);
  });
  
  Object.entries(theme.components.card).forEach(([key, value]) => {
    root.style.setProperty(`--card-${kebabCase(key)}`, value);
  });
  
  Object.entries(theme.components.input).forEach(([key, value]) => {
    root.style.setProperty(`--input-${kebabCase(key)}`, value);
  });
  
  Object.entries(theme.components.sidebar).forEach(([key, value]) => {
    root.style.setProperty(`--sidebar-${kebabCase(key)}`, value);
  });
  
  // Classe pour le mode sombre
  root.classList.toggle('dark-mode', isDarkMode);
}

/**
 * Génère une palette sombre basée sur les couleurs claires
 */
function getDarkModeColors(lightColors: TenantTheme['colors']): TenantTheme['colors'] {
  return {
    ...lightColors,
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    surface: '#334155',
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    border: '#475569',
    borderLight: '#374151',
    borderDark: '#1e293b'
  };
}

/**
 * Convertit camelCase en kebab-case
 */
function kebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// === STYLES GLOBAUX ===

export const createGlobalThemeStyles = () => `
  :root {
    /* Variables CSS seront injectées dynamiquement par le ThemeProvider */
  }
  
  .dark-mode {
    color-scheme: dark;
  }
  
  /* Classes utilitaires pour les thèmes */
  .bg-primary { background-color: var(--color-primary); }
  .bg-secondary { background-color: var(--color-secondary); }
  .bg-surface { background-color: var(--color-surface); }
  .bg-background { background-color: var(--color-background); }
  
  .text-primary { color: var(--color-text-primary); }
  .text-secondary { color: var(--color-text-secondary); }
  .text-muted { color: var(--color-text-muted); }
  
  .border-default { border-color: var(--color-border); }
  .border-light { border-color: var(--color-border-light); }
  .border-dark { border-color: var(--color-border-dark); }
  
  /* Transitions fluides pour les changements de thème */
  * {
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }
`;

// === HOOK UTILITAIRES ===

/**
 * Hook pour appliquer les couleurs du thème dans styled-components
 */
export const useThemeColors = () => {
  const { currentTheme, isDarkMode } = useTheme();
  return isDarkMode ? getDarkModeColors(currentTheme.colors) : currentTheme.colors;
};

/**
 * Hook pour appliquer la typographie du thème
 */
export const useThemeTypography = () => {
  const { currentTheme } = useTheme();
  return currentTheme.typography;
};

/**
 * Hook pour appliquer les espacements du thème
 */
export const useThemeSpacing = () => {
  const { currentTheme } = useTheme();
  return currentTheme.spacing;
};

/**
 * Hook pour appliquer les styles de composants du thème
 */
export const useThemeComponents = () => {
  const { currentTheme } = useTheme();
  return currentTheme.components;
};