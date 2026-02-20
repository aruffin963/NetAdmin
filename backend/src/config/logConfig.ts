/**
 * Configuration centralisée des actions et types de ressources pour le logging
 * Assure une cohérence dans toute l'application
 */

/**
 * Actions standard (verbes)
 */
export const LogActions = {
  // Authentification
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  
  // CRUD
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LIST: 'LIST',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  
  // Sécurité
  ENABLE_2FA: 'ENABLE_2FA',
  DISABLE_2FA: 'DISABLE_2FA',
  VERIFY_2FA: 'VERIFY_2FA',
  
  // Droits d'accès
  PERMISSION_GRANT: 'PERMISSION_GRANT',
  PERMISSION_REVOKE: 'PERMISSION_REVOKE',
  ROLE_ASSIGN: 'ROLE_ASSIGN',
  ROLE_REVOKE: 'ROLE_REVOKE',
  
  // Opérations
  START: 'START',
  STOP: 'STOP',
  RESTART: 'RESTART',
  BACKUP: 'BACKUP',
  RESTORE: 'RESTORE',
  
  // Configuration
  CONFIGURE: 'CONFIGURE',
  DEPLOY: 'DEPLOY',
  SYNC: 'SYNC',
  SCAN: 'SCAN',
  
  // Monitoring
  VIEW_DASHBOARD: 'VIEW_DASHBOARD',
  RUN_REPORT: 'RUN_REPORT',
  ALERT_TRIGGERED: 'ALERT_TRIGGERED',
} as const;

/**
 * Types de ressources (noms)
 */
export const ResourceTypes = {
  // Utilisateurs
  USER: 'USER',
  ACCOUNT: 'ACCOUNT',
  PROFILE: 'PROFILE',
  SESSION: 'SESSION',
  
  // Authentification
  TOKEN: 'TOKEN',
  TWO_FA: '2FA',
  BACKUP_CODE: 'BACKUP_CODE',
  
  // Infrastructure
  DEVICE: 'DEVICE',
  SERVER: 'SERVER',
  NETWORK: 'NETWORK',
  VLAN: 'VLAN',
  SUBNET: 'SUBNET',
  
  // Services
  SERVICE: 'SERVICE',
  APPLICATION: 'APPLICATION',
  DATABASE: 'DATABASE',
  
  // Configuration
  ORGANIZATION: 'ORGANIZATION',
  CONFIGURATION: 'CONFIGURATION',
  SETTING: 'SETTING',
  POLICY: 'POLICY',
  
  // Monitoring
  ALERT: 'ALERT',
  METRIC: 'METRIC',
  DASHBOARD: 'DASHBOARD',
  REPORT: 'REPORT',
  
  // Pages
  PAGE: 'PAGE',
  API_ENDPOINT: 'API_ENDPOINT',
  BACKUP: 'BACKUP',
  
  // Système
  SYSTEM: 'SYSTEM',
  LOG: 'LOG',
} as const;

/**
 * Statuts de log
 */
export const LogStatus = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
} as const;

/**
 * Formateurs de détails pour les logs
 */
export const LogFormatters = {
  /**
   * Formate les détails d'une action CRUD
   */
  crudOperation: (method: string, resourceType: string, id?: string, changes?: any) => ({
    operation: method,
    resourceType,
    resourceId: id,
    changes,
    timestamp: new Date().toISOString(),
  }),

  /**
   * Formate les détails d'une authentification
   */
  authentication: (method: string, success: boolean, reason?: string) => ({
    method,
    success,
    reason,
    timestamp: new Date().toISOString(),
  }),

  /**
   * Formate les détails d'une action d'accès
   */
  access: (endpoint: string, method: string, statusCode: number) => ({
    endpoint,
    method,
    statusCode,
    timestamp: new Date().toISOString(),
  }),

  /**
   * Formate les détails d'une erreur
   */
  error: (code: string, message: string, stack?: string) => ({
    errorCode: code,
    errorMessage: message,
    stackTrace: stack,
    timestamp: new Date().toISOString(),
  }),

  /**
   * Formate les détails d'un changement de configuration
   */
  configuration: (section: string, oldValue: any, newValue: any) => ({
    section,
    oldValue,
    newValue,
    changedAt: new Date().toISOString(),
  }),
};

/**
 * Exemples d'utilisation du logging
 */
export const LoggingExamples = {
  /**
   * Exemple 1: Logger une création d'utilisateur
   * 
   * await req.logActivity(
   *   LogActions.CREATE,
   *   ResourceTypes.USER,
   *   {
   *     userId: newUser.id,
   *     email: newUser.email,
   *     role: newUser.role,
   *   },
   *   LogStatus.SUCCESS
   * );
   */

  /**
   * Exemple 2: Logger une modification de configuration
   * 
   * await req.logActivity(
   *   LogActions.UPDATE,
   *   ResourceTypes.CONFIGURATION,
   *   LogFormatters.configuration('database', oldConfig, newConfig),
   *   LogStatus.SUCCESS
   * );
   */

  /**
   * Exemple 3: Logger un affichage de page
   * 
   * await req.logActivity(
   *   LogActions.VIEW_DASHBOARD,
   *   ResourceTypes.PAGE,
   *   { section: 'Network Overview' },
   *   LogStatus.SUCCESS
   * );
   */

  /**
   * Exemple 4: Logger une erreur
   * 
   * await req.logActivity(
   *   LogActions.DELETE,
   *   ResourceTypes.DEVICE,
   *   LogFormatters.error('DEVICE_001', 'Device not found'),
   *   LogStatus.ERROR
   * );
   */
};
