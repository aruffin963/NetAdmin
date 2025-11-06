/**
 * Routes API pour la gestion multi-tenant
 * CRUD des tenants, domaines et configurations
 */

import { Router, Request, Response } from 'express';
import { body, query, param } from 'express-validator';
import { 
  TenantSettings, 
  TenantCreateRequest, 
  TenantUpdateRequest,
  TenantListResponse,
  DomainConfig,
  TenantFeatures,
  DEFAULT_THEMES
} from '../../../shared/src/types/tenant';

const router = Router();

// Validation middleware
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
];

const validateTenantCreate = [
  body('organizationName').notEmpty().isLength({ min: 2, max: 100 }),
  body('domain').isURL().contains('.'),
  body('subdomain').optional().isLength({ min: 2, max: 50 }).matches(/^[a-z0-9-]+$/),
  body('adminEmail').isEmail(),
  body('adminFirstName').notEmpty().isLength({ min: 1, max: 50 }),
  body('adminLastName').notEmpty().isLength({ min: 1, max: 50 })
];

const validateTenantUpdate = [
  body('organizationName').optional().isLength({ min: 2, max: 100 }),
  body('domain').optional().isURL().contains('.'),
  body('subdomain').optional().isLength({ min: 2, max: 50 }).matches(/^[a-z0-9-]+$/),
  body('isActive').optional().isBoolean(),
  body('maxUsers').optional().isInt({ min: 1, max: 10000 }),
  body('maxNetworks').optional().isInt({ min: 1, max: 1000 })
];

// === ROUTES TENANTS ===

/**
 * GET /api/tenants
 * Liste tous les tenants avec pagination
 */
router.get('/', validatePagination, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const search = req.query.search as string;
    const status = req.query.status as string;

    // Simulation de données pour le développement
    const mockTenants: TenantSettings[] = [
      {
        id: 'tenant-1',
        organizationName: 'Acme Corporation',
        domain: 'acme.netadmin.pro',
        subdomain: 'acme',
        isActive: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-11-04'),
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
            welcomeMessage: 'Bienvenue sur votre tableau de bord réseau Acme',
            footerText: '© 2025 Acme Corporation. Tous droits réservés.'
          }
        },
        theme: DEFAULT_THEMES[0],
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
        id: 'tenant-2',
        organizationName: 'Tech Solutions SARL',
        domain: 'techsol.netadmin.pro',
        subdomain: 'techsol',
        isActive: true,
        createdAt: new Date('2025-02-15'),
        updatedAt: new Date('2025-11-03'),
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
        theme: DEFAULT_THEMES[0],
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

    // Filtrage basique
    let filteredTenants = mockTenants;
    
    if (search) {
      filteredTenants = filteredTenants.filter(tenant => 
        tenant.organizationName.toLowerCase().includes(search.toLowerCase()) ||
        tenant.domain.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (status) {
      filteredTenants = filteredTenants.filter(tenant => 
        status === 'active' ? tenant.isActive : !tenant.isActive
      );
    }

    // Pagination
    const total = filteredTenants.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTenants = filteredTenants.slice(startIndex, endIndex);

    const response: TenantListResponse = {
      tenants: paginatedTenants,
      total,
      page,
      limit
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des tenants',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * GET /api/tenants/:id
 * Récupère un tenant par son ID
 */
router.get('/:id', param('id').notEmpty(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Simulation - en production, récupérer depuis la DB
    const mockTenant: TenantSettings = {
      id,
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
          welcomeMessage: 'Bienvenue sur votre tableau de bord réseau'
        }
      },
      theme: DEFAULT_THEMES[0],
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
    };

    res.json(mockTenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du tenant',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/tenants
 * Crée un nouveau tenant
 */
router.post('/', validateTenantCreate, async (req: Request, res: Response) => {
  try {
    const tenantData: TenantCreateRequest = req.body;

    // Validation des domaines disponibles
    const existingDomain = await checkDomainAvailability(tenantData.domain, tenantData.subdomain);
    if (!existingDomain) {
      return res.status(400).json({
        error: 'Le domaine ou sous-domaine est déjà utilisé'
      });
    }

    // Création du tenant
    const newTenant: TenantSettings = {
      id: `tenant-${Date.now()}`,
      organizationName: tenantData.organizationName,
      domain: tenantData.domain,
      subdomain: tenantData.subdomain,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      maxUsers: 25, // Défaut pour nouveaux tenants
      maxNetworks: 10,
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
        multiUser: true,
        ...tenantData.features
      },
      branding: {
        companyName: tenantData.organizationName,
        primaryColor: '#60a5fa',
        secondaryColor: '#34d399',
        accentColor: '#f59e0b',
        assets: [],
        customTexts: {},
        ...tenantData.branding
      },
      theme: {
        ...DEFAULT_THEMES[0],
        ...tenantData.theme
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
    };

    // TODO: Sauvegarder en base de données
    // TODO: Créer l'utilisateur admin
    // TODO: Configurer le domaine DNS

    return res.status(201).json(newTenant);
  } catch (error) {
    console.error('Error creating tenant:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de la création du tenant',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * PUT /api/tenants/:id
 * Met à jour un tenant existant
 */
router.put('/:id', param('id').notEmpty(), validateTenantUpdate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: TenantUpdateRequest = req.body;

    // TODO: Récupérer le tenant existant depuis la DB
    // TODO: Appliquer les modifications
    // TODO: Valider les contraintes (domaines, limites)
    // TODO: Sauvegarder en base

    const updatedTenant: TenantSettings = {
      id,
      organizationName: updateData.organizationName || 'Acme Corporation',
      domain: updateData.domain || 'acme.netadmin.pro',
      subdomain: updateData.subdomain || 'acme',
      isActive: updateData.isActive !== undefined ? updateData.isActive : true,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date(),
      maxUsers: updateData.maxUsers || 100,
      maxNetworks: updateData.maxNetworks || 50,
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
        multiUser: true,
        ...updateData.features
      },
      branding: {
        companyName: 'Acme Corporation',
        primaryColor: '#60a5fa',
        secondaryColor: '#34d399',
        accentColor: '#f59e0b',
        assets: [],
        customTexts: {},
        ...updateData.branding
      },
      theme: {
        ...DEFAULT_THEMES[0],
        ...updateData.theme
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
        },
        ...updateData.preferences
      }
    };

    res.json(updatedTenant);
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la mise à jour du tenant',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * DELETE /api/tenants/:id
 * Supprime un tenant (soft delete)
 */
router.delete('/:id', param('id').notEmpty(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: Soft delete du tenant
    // TODO: Désactiver les utilisateurs
    // TODO: Archiver les données
    // TODO: Libérer les domaines

    res.json({ 
      message: 'Tenant supprimé avec succès',
      id 
    });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du tenant',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// === ROUTES DOMAINES ===

/**
 * GET /api/tenants/:id/domains
 * Liste les domaines d'un tenant
 */
router.get('/:id/domains', param('id').notEmpty(), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mockDomains: DomainConfig[] = [
      {
        id: 'domain-1',
        tenantId: id,
        domain: 'acme.netadmin.pro',
        subdomain: 'acme',
        isActive: true,
        isPrimary: true,
        sslEnabled: true,
        createdAt: new Date('2025-01-01'),
        dnsSettings: {
          aRecord: '192.168.1.100',
          cnameRecord: 'acme.netadmin.pro',
          mxRecords: ['mail.acme.com'],
          txtRecords: ['v=spf1 include:_spf.acme.com ~all']
        }
      }
    ];

    res.json(mockDomains);
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des domaines',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/tenants/:id/domains
 * Ajoute un nouveau domaine à un tenant
 */
router.post('/:id/domains', 
  param('id').notEmpty(),
  body('domain').isURL().contains('.'),
  body('subdomain').optional().isLength({ min: 2, max: 50 }),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { domain, subdomain, isPrimary } = req.body;

    // Vérifier la disponibilité du domaine
    const isAvailable = await checkDomainAvailability(domain, subdomain);
    if (!isAvailable) {
      return res.status(400).json({
        error: 'Le domaine ou sous-domaine est déjà utilisé'
      });
    }

    const newDomain: DomainConfig = {
      id: `domain-${Date.now()}`,
      tenantId: id,
      domain,
      subdomain,
      isActive: true,
      isPrimary: isPrimary || false,
      sslEnabled: false,
      createdAt: new Date(),
      dnsSettings: {
        aRecord: '',
        cnameRecord: '',
        mxRecords: [],
        txtRecords: []
      }
    };

    // TODO: Configurer les DNS
    // TODO: Demander certificat SSL si nécessaire
    // TODO: Sauvegarder en base

    return res.status(201).json(newDomain);
  } catch (error) {
    console.error('Error adding domain:', error);
    return res.status(500).json({ 
      error: 'Erreur lors de l\'ajout du domaine',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// === UTILITAIRES ===

/**
 * Vérifie si un domaine/sous-domaine est disponible
 */
async function checkDomainAvailability(domain: string, subdomain?: string): Promise<boolean> {
  // TODO: Vérifier en base de données
  // Pour l'instant, simulation
  const reservedSubdomains = ['admin', 'api', 'www', 'mail', 'ftp'];
  
  if (subdomain && reservedSubdomains.includes(subdomain.toLowerCase())) {
    return false;
  }
  
  return true;
}

export default router;