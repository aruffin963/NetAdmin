import { Request, Response, NextFunction } from 'express';
import { ActivityLogService, LogActions, ResourceTypes } from '../services/activityLogService';

interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Middleware pour logger automatiquement certaines actions
 */
export const autoLogMiddleware = (
  action: string,
  resourceType: string,
  getResourceInfo?: (req: AuthenticatedRequest) => { id?: string; name?: string }
) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    const originalJson = res.json;

    // Intercepter la réponse pour logger après le succès
    res.send = function (data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logActivity(req, action, resourceType, getResourceInfo);
      }
      return originalSend.call(this, data);
    };

    res.json = function (data: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logActivity(req, action, resourceType, getResourceInfo);
      }
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Logger une activité
 */
async function logActivity(
  req: AuthenticatedRequest,
  action: string,
  resourceType: string,
  getResourceInfo?: (req: AuthenticatedRequest) => { id?: string; name?: string }
) {
  const username = req.user?.username || 'anonymous';
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent');

  let resourceId: string | undefined;
  let resourceName: string | undefined;

  if (getResourceInfo) {
    const info = getResourceInfo(req);
    resourceId = info.id;
    resourceName = info.name;
  } else {
    // Essayer d'extraire l'ID depuis les paramètres ou le body
    resourceId = req.params.id || req.body.id;
    resourceName = req.body.name || req.body.application || req.body.organization_name;
  }

  await ActivityLogService.log({
    username,
    action,
    resourceType,
    resourceId,
    resourceName,
    details: {
      method: req.method,
      path: req.path,
      params: req.params,
      // Ne pas logger les mots de passe ou données sensibles
      body: sanitizeBody(req.body)
    },
    ipAddress,
    userAgent,
    status: 'success'
  });
}

/**
 * Nettoyer le body pour ne pas logger les données sensibles
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'secret_key', 'token', 'api_key', 'plainPassword'];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * Logger une action manuellement depuis un contrôleur
 */
export async function logAction(
  req: AuthenticatedRequest,
  action: string,
  resourceType: string,
  options: {
    resourceId?: string;
    resourceName?: string;
    details?: Record<string, any>;
    status?: 'success' | 'error' | 'warning';
    errorMessage?: string;
  } = {}
) {
  const username = req.user?.username || 'anonymous';
  const ipAddress = req.ip || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent');

  await ActivityLogService.log({
    username,
    action,
    resourceType,
    resourceId: options.resourceId,
    resourceName: options.resourceName,
    details: options.details,
    ipAddress,
    userAgent,
    status: options.status || 'success',
    errorMessage: options.errorMessage
  });
}

export { LogActions, ResourceTypes };
