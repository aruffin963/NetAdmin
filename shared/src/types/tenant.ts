/**
 * Types TypeScript pour le système multi-tenant
 * Gestion des organisations, thèmes et branding personnalisés
 */

// === TYPES DE BASE ===

export interface TenantId {
  id: string;
  organizationName: string;
  domain: string;
  subdomain?: string;
}

export interface TenantSettings {
  id: string;
  organizationName: string;
  domain: string;
  subdomain?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Configuration
  maxUsers: number;
  maxNetworks: number;
  features: TenantFeatures;
  
  // Branding
  branding: TenantBranding;
  
  // Thème
  theme: TenantTheme;
  
  // Paramètres spécifiques
  preferences: TenantPreferences;
}

// === FONCTIONNALITÉS ===

export interface TenantFeatures {
  ipManagement: boolean;
  monitoring: boolean;
  topology: boolean;
  subnetting: boolean;
  alerts: boolean;
  reporting: boolean;
  api: boolean;
  sso: boolean;
  customBranding: boolean;
  multiUser: boolean;
}

// === BRANDING ===

export interface TenantBranding {
  logoUrl?: string;
  faviconUrl?: string;
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  
  // Assets
  assets: BrandingAsset[];
  
  // Textes personnalisés
  customTexts: CustomTexts;
}

export interface BrandingAsset {
  id: string;
  type: 'logo' | 'favicon' | 'background' | 'icon';
  url: string;
  filename: string;
  size: number;
  uploadedAt: Date;
}

export interface CustomTexts {
  appTitle?: string;
  welcomeMessage?: string;
  footerText?: string;
  loginMessage?: string;
  dashboardTitle?: string;
}

// === THÈMES ===

export interface TenantTheme {
  id: string;
  name: string;
  type: 'light' | 'dark' | 'custom';
  
  // Couleurs principales
  colors: ThemeColors;
  
  // Typographie
  typography: ThemeTypography;
  
  // Espacements et dimensions
  spacing: ThemeSpacing;
  
  // Composants spécifiques
  components: ThemeComponents;
}

export interface ThemeColors {
  // Couleurs primaires
  primary: string;
  primaryHover: string;
  primaryActive: string;
  
  // Couleurs secondaires
  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  
  // Couleurs d'accent
  accent: string;
  accentHover: string;
  
  // Couleurs de fond
  background: string;
  backgroundSecondary: string;
  surface: string;
  
  // Couleurs de texte
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Couleurs de statut
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Bordures
  border: string;
  borderLight: string;
  borderDark: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontFamilyMono: string;
  
  fontSizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  
  fontWeights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  
  lineHeights: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

export interface ThemeComponents {
  // Boutons
  button: {
    borderRadius: string;
    padding: string;
    fontSize: string;
  };
  
  // Cartes
  card: {
    borderRadius: string;
    padding: string;
    shadow: string;
  };
  
  // Inputs
  input: {
    borderRadius: string;
    padding: string;
    fontSize: string;
  };
  
  // Navigation
  sidebar: {
    width: string;
    backgroundColor: string;
    textColor: string;
  };
}

// === PRÉFÉRENCES ===

export interface TenantPreferences {
  // Langue et localisation
  language: 'fr' | 'en' | 'es' | 'de';
  timezone: string;
  dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
  timeFormat: '12h' | '24h';
  
  // Affichage
  itemsPerPage: number;
  defaultView: 'grid' | 'list';
  showTooltips: boolean;
  showAnimations: boolean;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  alertThreshold: 'low' | 'medium' | 'high';
  
  // Fonctionnalités
  autoRefresh: boolean;
  refreshInterval: number; // en secondes
  enableDarkMode: boolean;
  compactMode: boolean;
  
  // Sécurité
  sessionTimeout: number; // en minutes
  requireMFA: boolean;
  passwordPolicy: PasswordPolicy;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  expirationDays: number;
}

// === DOMAINES ET SOUS-DOMAINES ===

export interface DomainConfig {
  id: string;
  tenantId: string;
  domain: string;
  subdomain?: string;
  isActive: boolean;
  isPrimary: boolean;
  sslEnabled: boolean;
  createdAt: Date;
  
  // Configuration DNS
  dnsSettings: DnsSettings;
}

export interface DnsSettings {
  aRecord?: string;
  cnameRecord?: string;
  mxRecords?: string[];
  txtRecords?: string[];
}

// === UTILISATEURS ET PERMISSIONS ===

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: TenantRole;
  permissions: string[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export enum TenantRole {
  SUPER_ADMIN = 'super_admin',
  TENANT_ADMIN = 'tenant_admin',
  NETWORK_ADMIN = 'network_admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer'
}

// === API RESPONSES ===

export interface TenantListResponse {
  tenants: TenantSettings[];
  total: number;
  page: number;
  limit: number;
}

export interface TenantCreateRequest {
  organizationName: string;
  domain: string;
  subdomain?: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  features: Partial<TenantFeatures>;
  branding?: Partial<TenantBranding>;
  theme?: Partial<TenantTheme>;
}

export interface TenantUpdateRequest {
  organizationName?: string;
  domain?: string;
  subdomain?: string;
  isActive?: boolean;
  maxUsers?: number;
  maxNetworks?: number;
  features?: Partial<TenantFeatures>;
  branding?: Partial<TenantBranding>;
  theme?: Partial<TenantTheme>;
  preferences?: Partial<TenantPreferences>;
}

// === THÈMES PRÉDÉFINIS ===

export const DEFAULT_THEMES: TenantTheme[] = [
  {
    id: 'netadmin-default',
    name: 'NetAdmin Pro',
    type: 'light',
    colors: {
      primary: '#60a5fa',
      primaryHover: '#3b82f6',
      primaryActive: '#2563eb',
      secondary: '#34d399',
      secondaryHover: '#10b981',
      secondaryActive: '#059669',
      accent: '#f59e0b',
      accentHover: '#d97706',
      background: '#ffffff',
      backgroundSecondary: '#f8fafc',
      surface: '#ffffff',
      textPrimary: '#1e293b',
      textSecondary: '#475569',
      textMuted: '#64748b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
      border: '#e2e8f0',
      borderLight: '#f1f5f9',
      borderDark: '#cbd5e1'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontFamilyMono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      fontWeights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeights: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
      '4xl': '6rem'
    },
    components: {
      button: {
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        fontSize: '0.875rem'
      },
      card: {
        borderRadius: '1rem',
        padding: '1.5rem',
        shadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      },
      input: {
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        fontSize: '0.875rem'
      },
      sidebar: {
        width: '280px',
        backgroundColor: '#1e293b',
        textColor: '#e2e8f0'
      }
    }
  }
];

// === UTILS ===

export type TenantThemeType = 'light' | 'dark' | 'custom';
export type TenantStatus = 'active' | 'inactive' | 'suspended';
export type AssetType = 'logo' | 'favicon' | 'background' | 'icon';