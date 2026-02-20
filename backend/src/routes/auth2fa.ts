import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/auth';
import TwoFactorAuthService from '../services/twoFactorAuthService';
import { DatabaseService } from '../config/database';
import { logger } from '../utils/logger';
import { pool } from '../config/database';

const router = Router();

/**
 * Interface pour les requests 2FA
 */
interface TwoFactorRequest extends Request {
  user?: {
    id: number;
    email?: string;
    username: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  };
}

/**
 * POST /api/auth/2fa/setup
 * Démarre la configuration du 2FA
 * Retourne: secret, QR code data URL, et codes de secours
 */
router.post('/setup', isAuthenticated, async (req: TwoFactorRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Vérifier que le 2FA n'est pas déjà activé
    const isEnabled = await TwoFactorAuthService.isTwoFactorEnabled(userId);
    if (isEnabled) {
      res.status(400).json({ error: '2FA is already enabled for this account' });
      return;
    }

    // Générer le secret
    const { secret, qrCode } = TwoFactorAuthService.generateSecret(userEmail);

    // Générer le QR code en base64
    const qrCodeDataUrl = await TwoFactorAuthService.generateQRCodeDataUrl(qrCode);

    // Générer les codes de secours
    const backupCodes = TwoFactorAuthService.generateBackupCodes(10);

    logger.info(`📱 2FA setup initiated for user ${userId}`);

    res.json({
      success: true,
      secret,
      qrCode: qrCodeDataUrl,
      backupCodes,
      message: 'Scan the QR code with your authenticator app and save backup codes',
    });
  } catch (error) {
    logger.error('Error in 2FA setup:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

/**
 * POST /api/auth/2fa/verify
 * Vérifie le code TOTP et active le 2FA
 * Body: { secret, token, backupCodes }
 */
router.post('/verify', isAuthenticated, async (req: TwoFactorRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { secret, token, backupCodes } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    if (!secret || !token || !backupCodes || !Array.isArray(backupCodes)) {
      res.status(400).json({ error: 'Missing required fields' });
    }

    // Vérifier le code TOTP
    const isValidToken = TwoFactorAuthService.verifyTOTP(secret, token);
    if (!isValidToken) {
      res.status(400).json({ error: 'Invalid TOTP code' });
    }

    // Activer le 2FA
    await TwoFactorAuthService.enableTwoFactorAuth(userId, secret);

    // Sauvegarder les codes de secours
    await TwoFactorAuthService.saveBackupCodes(userId, backupCodes);

    // Enregistrer l'événement
    await TwoFactorAuthService.recordLoginAttempt(userId, true, 'totp', req.ip);

    logger.info(`✅ 2FA verified and enabled for user ${userId}`);

    res.json({
      success: true,
      message: '2FA has been successfully enabled',
    });
  } catch (error) {
    logger.error('Error verifying 2FA:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

/**
 * POST /api/auth/2fa/disable
 * Désactive le 2FA
 * Body: { password } - Pour sécurité supplémentaire
 */
router.post('/disable', isAuthenticated, async (req: TwoFactorRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    // Vérifier que le 2FA est activé
    const isEnabled = await TwoFactorAuthService.isTwoFactorEnabled(userId);
    if (!isEnabled) {
      res.status(400).json({ error: '2FA is not enabled for this account' });
    }

    // Désactiver le 2FA
    await TwoFactorAuthService.disableTwoFactorAuth(userId);

    logger.info(`❌ 2FA disabled for user ${userId}`);

    res.json({
      success: true,
      message: '2FA has been disabled',
    });
  } catch (error) {
    logger.error('Error disabling 2FA:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

/**
 * GET /api/auth/2fa/status
 * Récupère le statut 2FA de l'utilisateur
 */
router.get('/status', isAuthenticated, async (req: TwoFactorRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    const status = await TwoFactorAuthService.get2FAStatus(userId);
    const backupCodesCount = await TwoFactorAuthService.getBackupCodesCount(userId);

    res.json({
      success: true,
      enabled: status ? status.totp_enabled : false,
      backupCodesRemaining: backupCodesCount,
      lastVerified: status?.last_verified_at || null,
      createdAt: status?.created_at || null,
    });
  } catch (error) {
    logger.error('Error getting 2FA status:', error);
    res.status(500).json({ error: 'Failed to get 2FA status' });
  }
});

/**
 * POST /api/auth/2fa/generate-backup-codes
 * Génère de nouveaux codes de secours
 */
router.post(
  '/generate-backup-codes',
  isAuthenticated,
  async (req: TwoFactorRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
      }

      // Vérifier que le 2FA est activé
      const isEnabled = await TwoFactorAuthService.isTwoFactorEnabled(userId);
      if (!isEnabled) {
        res
          .status(400)
          .json({ error: '2FA must be enabled to generate backup codes' });
        return;
      }

      // Générer les codes
      const backupCodes = TwoFactorAuthService.generateBackupCodes(10);

      // Sauvegarder les codes
      await TwoFactorAuthService.saveBackupCodes(userId, backupCodes);

      logger.info(`🔄 Generated new backup codes for user ${userId}`);

      res.json({
        success: true,
        backupCodes,
        message: 'New backup codes generated. Save them in a secure place.',
      });
    } catch (error) {
      logger.error('Error generating backup codes:', error);
      res.status(500).json({ error: 'Failed to generate backup codes' });
    }
  }
);

/**
 * POST /api/auth/2fa/verify-token
 * Vérifie un code TOTP durant le login
 * Body: { token } (when authenticated) or { token, userId } (for login)
 */
router.post('/verify-token', async (req: TwoFactorRequest, res: Response): Promise<void> => {
  try {
    // Support both authenticated users and login-time verification
    let userId = req.user?.id;
    const { token, userId: loginUserId } = req.body;
    const isLoginFlow = !userId && loginUserId; // Determine if this is login-time verification

    // If not authenticated, accept userId from request body (for login flow)
    if (!userId && loginUserId) {
      userId = loginUserId;
    }

    if (!userId || !token) {
      logger.warn(`Missing required fields - userId: ${userId}, token: ${token ? 'provided' : 'missing'}`);
      res.status(400).json({ error: 'Missing required fields' });
    }

    logger.info(`Verifying TOTP token for userId ${userId} (loginFlow: ${isLoginFlow})`);

    // Récupérer le secret TOTP de l'utilisateur
    const secret = await TwoFactorAuthService.getTOTPSecret(userId);
    if (!secret) {
      logger.warn(`No TOTP secret found for userId ${userId}`);
      res.status(400).json({ error: 'TOTP not configured for this user' });
    }

    logger.info(`Secret retrieved for userId ${userId} (length: ${secret.length})`);

    // Vérifier le code
    const isValid = TwoFactorAuthService.verifyTOTP(secret, token);
    logger.info(`TOTP verification result for userId ${userId}: ${isValid ? 'VALID' : 'INVALID'} (token: ${token})`);

    // Enregistrer la tentative
    await TwoFactorAuthService.recordLoginAttempt(
      userId,
      isValid,
      'totp',
      req.ip,
      req.get('user-agent')
    );

    if (isValid) {
      logger.info(`✅ TOTP verified for user ${userId}`);
      
      // If this is login-time verification, complete the login by creating a session
      if (isLoginFlow) {
        try {
          // Fetch user data to create session
          const userResult = await pool.query(
            'SELECT id, email, password, name, role, is_active FROM users WHERE id = $1',
            [userId]
          );

          if (userResult.rows.length === 0) {
            logger.warn(`User not found: ${userId}`);
            res.status(404).json({ error: 'User not found' });
          }

          const user = userResult.rows[0];

          // Create user object for session (same as login.ts)
          const sessionUser: Express.User = {
            id: user.id,
            username: user.name,
            email: user.email,
            full_name: user.name,
            is_active: user.is_active,
            created_at: new Date(),
            updated_at: new Date(),
          };

          // Use req.login to properly create Passport session
          req.login(sessionUser, { session: true }, (loginErr) => {
            if (loginErr) {
              logger.error('Error creating session after 2FA:', loginErr);
              res.status(500).json({ error: 'Failed to create session after 2FA verification' });
              return;
            }

            // Update last login
            pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId])
              .catch((err) => logger.error('Failed to update last_login:', err));

            logger.info(`✅ 2FA verified and login completed for user ${user.name}`);

            // Log successful 2FA login
            const { ActivityLogService } = require('../services/activityLogService');
            const { LogActions, ResourceTypes } = require('../services/activityLogService');
            const { LogStatus } = require('../config/logConfig');
            
            ActivityLogService.log({
              username: user.name,
              action: LogActions.LOGIN,
              resourceType: ResourceTypes.ACCOUNT,
              details: {
                method: 'JWT+2FA',
                userId: user.id,
                email: user.email,
                twoFactorMethod: 'TOTP'
              },
              ipAddress: req.ip || req.socket.remoteAddress,
              userAgent: req.get('User-Agent'),
              status: LogStatus.SUCCESS
            }).catch((logErr: any) => logger.error('Failed to log 2FA login:', logErr));
            
            res.json({
              success: true,
              message: 'TOTP code verified and logged in',
              data: {
                user: {
                  id: user.id,
                  username: user.name,
                  email: user.email,
                  role: user.role,
                }
              }
            });
          });
        } catch (sessionError) {
          logger.error('Error completing login after 2FA:', sessionError);
          res.status(500).json({ error: 'Failed to complete login after 2FA verification' });
        }
      } else {
        // Authenticated user just verifying their 2FA (for settings, not login)
        res.json({
          success: true,
          message: 'TOTP code verified',
        });
      }
    } else {
      logger.warn(`⚠️  Invalid TOTP code for user ${userId}`);
      res.status(401).json({ error: 'Invalid TOTP code. Please verify your authenticator app time is synchronized and try again.' });
    }
  } catch (error) {
    logger.error('Error verifying TOTP token:', error);
    res.status(500).json({ error: 'Failed to verify TOTP token' });
  }
});

/**
 * POST /api/auth/2fa/verify-backup-code
 * Vérifie un code de secours durant le login
 * Body: { code } (when authenticated) or { code, userId } (for login)
 */
router.post(
  '/verify-backup-code',
  async (req: TwoFactorRequest, res: Response): Promise<void> => {
    try {
      // Support both authenticated users and login-time verification
      let userId = req.user?.id;
      const { code, userId: loginUserId } = req.body;
      const isLoginFlow = !userId && loginUserId; // Determine if this is login-time verification

      // If not authenticated, accept userId from request body (for login flow)
      if (!userId && loginUserId) {
        userId = loginUserId;
      }

      if (!userId || !code) {
        res.status(400).json({ error: 'Missing required fields' });
      }

      // Vérifier et utiliser le code de secours
      const isValid = await TwoFactorAuthService.verifyAndUseBackupCode(userId, code);

      // Enregistrer la tentative
      await TwoFactorAuthService.recordLoginAttempt(
        userId,
        isValid,
        'backup_code',
        req.ip,
        req.get('user-agent')
      );

      if (isValid) {
        logger.info(`✅ Backup code used by user ${userId}`);
        
        // If this is login-time verification, complete the login by creating a session
        if (isLoginFlow) {
          try {
            // Fetch user data to create session
            const userResult = await pool.query(
              'SELECT id, email, password, name, role, is_active FROM users WHERE id = $1',
              [userId]
            );

            if (userResult.rows.length === 0) {
              res.status(404).json({ error: 'User not found' });
            }

            const user = userResult.rows[0];

            // Create user object for session (same as login.ts)
            const sessionUser: Express.User = {
              id: user.id,
              username: user.name,
              email: user.email,
              full_name: user.name,
              is_active: user.is_active,
              created_at: new Date(),
              updated_at: new Date(),
            };

            // Use req.login to properly create Passport session
            req.login(sessionUser, { session: true }, (loginErr) => {
              if (loginErr) {
                logger.error('Error creating session after 2FA:', loginErr);
                res.status(500).json({ error: 'Failed to create session after 2FA verification' });
                return;
              }

              // Update last login
              pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId])
                .catch((err) => logger.error('Failed to update last_login:', err));

              logger.info(`✅ 2FA (backup code) verified and login completed for user ${user.name}`);
              
              res.json({
                success: true,
                message: 'Backup code verified and logged in',
                data: {
                  user: {
                    id: user.id,
                    username: user.name,
                    email: user.email,
                    role: user.role,
                  }
                }
              });
            });
          } catch (sessionError) {
            logger.error('Error completing login after 2FA:', sessionError);
            res.status(500).json({ error: 'Failed to complete login after 2FA verification' });
          }
        } else {
          // Authenticated user just verifying their 2FA (for settings, not login)
          res.json({
            success: true,
            message: 'Backup code verified',
          });
        }
      } else {
        logger.warn(`⚠️  Invalid backup code for user ${userId}`);
        res.status(401).json({ error: 'Invalid backup code' });
      }
    } catch (error) {
      logger.error('Error verifying backup code:', error);
      res.status(500).json({ error: 'Failed to verify backup code' });
    }
  }
);

/**
 * GET /api/auth/2fa/history
 * Récupère l'historique des logins 2FA
 */
router.get('/history', isAuthenticated, async (req: TwoFactorRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
    }

    const history = await TwoFactorAuthService.getLoginHistory(userId, 20);

    res.json({
      success: true,
      history,
    });
  } catch (error) {
    logger.error('Error getting 2FA history:', error);
    res.status(500).json({ error: 'Failed to get 2FA history' });
  }
});

export default router;
