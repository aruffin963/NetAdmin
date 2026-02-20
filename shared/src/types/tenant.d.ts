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
    maxUsers: number;
    maxNetworks: number;
    features: TenantFeatures;
    branding: TenantBranding;
    theme: TenantTheme;
    preferences: TenantPreferences;
}
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
export interface TenantBranding {
    logoUrl?: string;
    faviconUrl?: string;
    companyName: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    assets: BrandingAsset[];
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
export interface TenantTheme {
    id: string;
    name: string;
    type: 'light' | 'dark' | 'custom';
    colors: ThemeColors;
    typography: ThemeTypography;
    spacing: ThemeSpacing;
    components: ThemeComponents;
}
export interface ThemeColors {
    primary: string;
    primaryHover: string;
    primaryActive: string;
    secondary: string;
    secondaryHover: string;
    secondaryActive: string;
    accent: string;
    accentHover: string;
    background: string;
    backgroundSecondary: string;
    surface: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    success: string;
    warning: string;
    error: string;
    info: string;
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
    button: {
        borderRadius: string;
        padding: string;
        fontSize: string;
    };
    card: {
        borderRadius: string;
        padding: string;
        shadow: string;
    };
    input: {
        borderRadius: string;
        padding: string;
        fontSize: string;
    };
    sidebar: {
        width: string;
        backgroundColor: string;
        textColor: string;
    };
}
export interface TenantPreferences {
    language: 'fr' | 'en' | 'es' | 'de';
    timezone: string;
    dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
    timeFormat: '12h' | '24h';
    itemsPerPage: number;
    defaultView: 'grid' | 'list';
    showTooltips: boolean;
    showAnimations: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    alertThreshold: 'low' | 'medium' | 'high';
    autoRefresh: boolean;
    refreshInterval: number;
    enableDarkMode: boolean;
    compactMode: boolean;
    sessionTimeout: number;
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
export interface DomainConfig {
    id: string;
    tenantId: string;
    domain: string;
    subdomain?: string;
    isActive: boolean;
    isPrimary: boolean;
    sslEnabled: boolean;
    createdAt: Date;
    dnsSettings: DnsSettings;
}
export interface DnsSettings {
    aRecord?: string;
    cnameRecord?: string;
    mxRecords?: string[];
    txtRecords?: string[];
}
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
export declare enum TenantRole {
    SUPER_ADMIN = "super_admin",
    TENANT_ADMIN = "tenant_admin",
    NETWORK_ADMIN = "network_admin",
    OPERATOR = "operator",
    VIEWER = "viewer"
}
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
export declare const DEFAULT_THEMES: TenantTheme[];
export type TenantThemeType = 'light' | 'dark' | 'custom';
export type TenantStatus = 'active' | 'inactive' | 'suspended';
export type AssetType = 'logo' | 'favicon' | 'background' | 'icon';
//# sourceMappingURL=tenant.d.ts.map