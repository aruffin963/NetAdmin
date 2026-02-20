"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_THEMES = exports.TenantRole = void 0;
var TenantRole;
(function (TenantRole) {
    TenantRole["SUPER_ADMIN"] = "super_admin";
    TenantRole["TENANT_ADMIN"] = "tenant_admin";
    TenantRole["NETWORK_ADMIN"] = "network_admin";
    TenantRole["OPERATOR"] = "operator";
    TenantRole["VIEWER"] = "viewer";
})(TenantRole || (exports.TenantRole = TenantRole = {}));
exports.DEFAULT_THEMES = [
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
//# sourceMappingURL=tenant.js.map