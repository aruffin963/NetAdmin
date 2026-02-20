import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import PasswordResetService from '../services/passwordResetService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/auth/forgot-password
 * Demander une réinitialisation de mot de passe
 */
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email valide requis'),
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { email } = req.body;

    const result = await PasswordResetService.requestPasswordReset(email);

    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in forgot-password endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue'
    });
  }
});

/**
 * POST /api/auth/validate-reset-token
 * Valider un jeton de réinitialisation
 */
router.post('/validate-reset-token', [
  body('token').notEmpty().withMessage('Token is required'),
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { token } = req.body;

    const result = await PasswordResetService.validateResetToken(token);

    if (result.valid) {
      res.status(200).json({
        success: true,
        data: {
          email: result.email
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Jeton invalide ou expiré'
      });
    }
  } catch (error: any) {
    logger.error('Error validating reset token:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue'
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Réinitialiser le mot de passe avec le jeton
 */
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((err: any) => ({
          field: err.param || err.path,
          message: err.msg
        })),
      });
      return;
    }

    const { token, password } = req.body;

    const result = await PasswordResetService.resetPassword(token, password);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    logger.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue'
    });
  }
});

/**
 * POST /api/auth/forgot-password-otp
 * Demander un OTP pour la réinitialisation de mot de passe
 */
router.post('/forgot-password-otp', [
  body('username').notEmpty().withMessage('Nom d\'utilisateur requis'),
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { username } = req.body;

    const result = await PasswordResetService.requestPasswordResetOTP(username);

    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error in forgot-password-otp endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue'
    });
  }
});

/**
 * POST /api/auth/validate-reset-otp
 * Valider le OTP et retourner un token de réinitialisation
 */
router.post('/validate-reset-otp', [
  body('username').notEmpty().withMessage('Nom d\'utilisateur requis'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP doit être 6 chiffres'),
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { username, otp } = req.body;

    const result = await PasswordResetService.validateResetOTP(username, otp);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    logger.error('Error validating OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Une erreur est survenue'
    });
  }
});

export default router;
