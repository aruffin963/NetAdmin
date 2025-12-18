/**
 * Middleware de détection et gestion multi-tenant
 * Détecte automatiquement le tenant basé sur le domaine/sous-domaine
 */

import { Request, Response, NextFunction } from 'express';
import { TenantSettings } from '../../../shared/src/types/tenant';

// Extension de l'interface Request pour inclure les infos tenant
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantSettings;
      tenantId?: string;
    }
  }
}

interface TenantDetectionResult {
  tenant: TenantSettings | null;
  error?: string;
}

/**
 * Cache en mémoire pour les tenants (en production: Redis)
 */
const tenantCache = new Map<string, TenantSettings>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Middleware principal de détection tenant
 */
export const tenantDetectionMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const result = await detectTenant(req);
    
    if (result.error) {
      return res.status(400).json({
        error: 'Tenant non trouvé',
        details: result.error
      });
    }
    
    if (!result.tenant) {
      return res.status(404).json({
        error: 'Aucun tenant associé à ce domaine'
      });
    }
    
    // Vérifier si le tenant est actif
    if (!result.tenant.isActive) {
      return res.status(403).json({
        error: 'Tenant désactivé',
        message: 'Ce tenant a été temporairement désactivé'
      });
    }
    
    // Attacher les informations tenant à la requête
    req.tenant = result.tenant;
    req.tenantId = result.tenant.id;
    
    // Headers pour debugging (optionnel)
    res.setHeader('X-Tenant-ID', result.tenant.id);
    res.setHeader('X-Tenant-Name', result.tenant.organizationName);
    
    return next();
  } catch (error) {
    console.error('Error in tenant detection middleware:', error);
    return res.status(500).json({
      error: 'Erreur interne de détection tenant',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
};

/**
 * Détecte le tenant basé sur le domaine/sous-domaine
 */
async function detectTenant(req: Request): Promise<TenantDetectionResult> {
  const host = req.get('host') || '';
  const userAgent = req.get('user-agent') || '';
  
  // Parse du host pour extraire domaine et sous-domaine
  const hostInfo = parseHost(host);
  
  if (!hostInfo.domain) {
    return {
      tenant: null,
      error: 'Domaine invalide ou manquant'
    };
  }
  
  // Vérifier le cache d'abord
  const cacheKey = `${hostInfo.subdomain || 'root'}.${hostInfo.domain}`;
  const cachedTenant = getCachedTenant(cacheKey);
  
  if (cachedTenant) {
    return { tenant: cachedTenant };
  }
  
  // Rechercher le tenant en base de données
  const tenant = await findTenantByDomain(hostInfo.domain, hostInfo.subdomain);
  
  if (tenant) {
    // Mettre en cache
    setCachedTenant(cacheKey, tenant);
    
    // Log pour analytics/monitoring
    logTenantAccess(tenant, req.ip || 'unknown', userAgent);
    
    return { tenant };
  }
  
  return {
    tenant: null,
    error: `Aucun tenant trouvé pour ${cacheKey}`
  };
}

/**
 * Parse l'host pour extraire domaine et sous-domaine
 */
function parseHost(host: string): { domain: string; subdomain?: string; port?: string } {
  // Supprimer le port si présent
  const [hostWithoutPort, port] = host.split(':');
  
  // Diviser par points
  const parts = hostWithoutPort.split('.');
  
  if (parts.length < 2) {
    return { domain: '', port };
  }
  
  // Déterminer si on a un sous-domaine
  if (parts.length === 2) {
    // example.com
    return {
      domain: hostWithoutPort,
      port
    };
  } else if (parts.length === 3) {
    // subdomain.example.com
    return {
      subdomain: parts[0],
      domain: parts.slice(1).join('.'),
      port
    };
  } else {
    // Plus complexe: subdomain.example.co.uk
    // Supposer que les 2 derniers sont le domaine principal
    return {
      subdomain: parts.slice(0, -2).join('.'),
      domain: parts.slice(-2).join('.'),
      port
    };
  }
}

/**
 * Recherche un tenant en base de données
 */
async function findTenantByDomain(domain: string, subdomain?: string): Promise<TenantSettings | null> {
  // TODO: Remplacer par une vraie requête DB
  // En attendant, simulation avec données mockées
  
  const mockTenants: TenantSettings[] = [
    {
      id: 'tenant-acme',
      organizationName: 'Acme Corporation',
      domain: 'acme.netadmin.pro',
      subdomain: 'acme',
      isActive: true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      maxUsers: 100,
      maxNetworks: 50,
      features: {
        ipManagement: true,
        monitoring: true,
        topology: true,
        subnetting: true,
        alerts: true,
        reporting: true,
        api: true,
        sso: false,
        customBranding: true,
        multiUser: true
      },
      branding: {
        companyName: 'Acme Corporation',
        primaryColor: '#2563eb',
        secondaryColor: '#10b981',
        accentColor: '#f59e0b',
        assets: [],
        customTexts: {
          appTitle: 'Acme Network Manager',
          welcomeMessage: 'Bienvenue sur votre tableau de bord réseau Acme'
        }
      },
      theme: {
        id: 'acme-theme',
        name: 'Acme Corporate',
        type: 'custom',
        colors: {
          primary: '#2563eb',
          primaryHover: '#1d4ed8',
          primaryActive: '#1e40af',
          secondary: '#10b981',
          secondaryHover: '#059669',
          secondaryActive: '#047857',
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
          fontFamily: 'Inter, sans-serif',
          fontFamilyMono: 'Monaco, monospace',
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
      },
      preferences: {
        language: 'fr',
        timezone: 'Europe/Paris',
        dateFormat: 'dd/mm/yyyy',
        timeFormat: '24h',
        itemsPerPage: 25,
        defaultView: 'grid',
        showTooltips: true,
        showAnimations: true,
        emailNotifications: true,
        pushNotifications: false,
        alertThreshold: 'medium',
        autoRefresh: true,
        refreshInterval: 30,
        enableDarkMode: false,
        compactMode: false,
        sessionTimeout: 480,
        requireMFA: false,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false,
          expirationDays: 90
        }
      }
    },
    {
      id: 'tenant-techsol',
      organizationName: 'Tech Solutions SARL',
      domain: 'techsol.netadmin.pro',
      subdomain: 'techsol',
      isActive: true,
      createdAt: new Date('2025-02-15'),
      updatedAt: new Date(),
      maxUsers: 50,
      maxNetworks: 25,
      features: {
        ipManagement: true,
        monitoring: true,
        topology: false,
        subnetting: true,
        alerts: true,
        reporting: false,
        api: false,
        sso: false,
        customBranding: false,
        multiUser: true
      },
      branding: {
        companyName: 'Tech Solutions SARL',
        primaryColor: '#60a5fa',
        secondaryColor: '#34d399',
        accentColor: '#f59e0b',
        assets: [],
        customTexts: {}
      },
      theme: {
        id: 'default-theme',
        name: 'NetAdmin Default',
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
          fontFamilyMono: 'Monaco, monospace',
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
      },
      preferences: {
        language: 'fr',
        timezone: 'Europe/Paris',
        dateFormat: 'dd/mm/yyyy',
        timeFormat: '24h',
        itemsPerPage: 20,
        defaultView: 'list',
        showTooltips: true,
        showAnimations: true,
        emailNotifications: true,
        pushNotifications: true,
        alertThreshold: 'high',
        autoRefresh: false,
        refreshInterval: 60,
        enableDarkMode: false,
        compactMode: true,
        sessionTimeout: 240,
        requireMFA: true,
        passwordPolicy: {
          minLength: 12,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          expirationDays: 60
        }
      }
    }
  ];
  
  // Recherche par domaine + sous-domaine
  if (subdomain) {
    const found = mockTenants.find(t => 
      t.domain === `${subdomain}.${domain}` || 
      (t.domain === domain && t.subdomain === subdomain)
    );
    if (found) return found;
  }
  
  // Recherche par domaine seul
  const found = mockTenants.find(t => t.domain === domain);
  return found || null;
}

/**
 * Gestion du cache tenant
 */
function getCachedTenant(key: string): TenantSettings | null {
  const timestamp = cacheTimestamps.get(key);
  if (!timestamp || Date.now() - timestamp > CACHE_TTL) {
    // Cache expiré
    tenantCache.delete(key);
    cacheTimestamps.delete(key);
    return null;
  }
  
  return tenantCache.get(key) || null;
}

function setCachedTenant(key: string, tenant: TenantSettings): void {
  tenantCache.set(key, tenant);
  cacheTimestamps.set(key, Date.now());
}

/**
 * Log des accès tenant pour analytics
 */
function logTenantAccess(tenant: TenantSettings, ip: string, userAgent: string): void {
  // TODO: Implémenter logging vers base analytics
  console.log(`Tenant access: ${tenant.organizationName} (${tenant.id}) from ${ip}`);
}

/**
 * Middleware pour vérifier les permissions de fonctionnalités
 */
export const requireFeature = (feature: keyof TenantSettings['features']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(401).json({
        error: 'Tenant non identifié'
      });
    }
    
    if (!req.tenant.features[feature]) {
      return res.status(403).json({
        error: 'Fonctionnalité non autorisée',
        feature,
        message: `La fonctionnalité "${feature}" n'est pas activée pour ce tenant`
      });
    }
    
    return next();
  };
};

/**
 * Middleware pour vérifier les limites de resources
 */
export const checkResourceLimits = (resourceType: 'users' | 'networks') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.tenant) {
      return res.status(401).json({
        error: 'Tenant non identifié'
      });
    }
    
    // TODO: Vérifier les limites en base de données
    // Pour l'instant, simulation
    const currentCount = await getCurrentResourceCount(req.tenant.id, resourceType);
    const maxAllowed = resourceType === 'users' ? req.tenant.maxUsers : req.tenant.maxNetworks;
    
    if (currentCount >= maxAllowed) {
      return res.status(429).json({
        error: 'Limite de ressources atteinte',
        resourceType,
        current: currentCount,
        max: maxAllowed,
        message: `Vous avez atteint la limite de ${maxAllowed} ${resourceType} pour votre plan`
      });
    }
    
    return next();
  };
};

/**
 * Obtient le nombre actuel de ressources pour un tenant
 */
async function getCurrentResourceCount(tenantId: string, resourceType: 'users' | 'networks'): Promise<number> {
  // TODO: Requête réelle en base
  return Math.floor(Math.random() * 50); // Simulation
}

/**
 * Utilitaire pour obtenir les infos tenant dans les routes
 */
export function getCurrentTenant(req: Request): TenantSettings | null {
  return req.tenant || null;
}

/**
 * Nettoyage périodique du cache
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > CACHE_TTL) {
      tenantCache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
}, CACHE_TTL); // Nettoyage toutes les 5 minutes

export default tenantDetectionMiddleware;