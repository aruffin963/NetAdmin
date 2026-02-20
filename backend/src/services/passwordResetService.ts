import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import emailService from './emailService';

export class PasswordResetService {
  /**
   * Générer un jeton de réinitialisation et envoyer un email
   */
  static async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Vérifier que l'utilisateur existe
      const userResult = await pool.query(
        'SELECT id, email, name FROM users WHERE email = $1 LIMIT 1',
        [email]
      );

      if (userResult.rows.length === 0) {
        logger.warn(`Password reset requested for non-existent user: ${email}`);
        // Pour des raisons de sécurité, ne pas révéler si l'email existe
        return {
          success: true,
          message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'
        };
      }

      const user = userResult.rows[0];

      // Générer un jeton sécurisé
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

      // Sauvegarder le jeton en base de données
      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expires_at = $2, password_reset_requested_at = CURRENT_TIMESTAMP WHERE id = $3',
        [hashedToken, expiresAt, user.id]
      );

      logger.info(`Password reset requested for user: ${user.email}`);

      // Envoyer l'email
      const emailSent = await emailService.sendPasswordResetEmail(user.email, resetToken, user.name);

      if (emailSent) {
        return {
          success: true,
          message: 'Un lien de réinitialisation a été envoyé à votre adresse email.'
        };
      } else {
        logger.error(`Failed to send password reset email to ${user.email}`);
        return {
          success: false,
          message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.'
        };
      }
    } catch (error: any) {
      logger.error('Error requesting password reset:', error);
      return {
        success: false,
        message: 'Une erreur est survenue. Veuillez réessayer.'
      };
    }
  }

  /**
   * Valider le jeton et réinitialiser le mot de passe
   */
  static async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!token || !newPassword || newPassword.length < 8) {
        return {
          success: false,
          message: 'Jeton invalide ou mot de passe trop court (minimum 8 caractères)'
        };
      }

      // Hacher le jeton fourni
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Rechercher l'utilisateur avec ce jeton
      const userResult = await pool.query(
        'SELECT id, email, name, reset_token_expires_at FROM users WHERE reset_token = $1 LIMIT 1',
        [hashedToken]
      );

      if (userResult.rows.length === 0) {
        logger.warn('Invalid password reset token');
        return {
          success: false,
          message: 'Jeton invalide ou expiré'
        };
      }

      const user = userResult.rows[0];

      // Vérifier que le jeton n'a pas expiré
      if (!user.reset_token_expires_at || new Date(user.reset_token_expires_at) < new Date()) {
        logger.warn(`Expired password reset token for user: ${user.email}`);
        
        // Supprimer le jeton expiré
        await pool.query(
          'UPDATE users SET reset_token = NULL, reset_token_expires_at = NULL WHERE id = $1',
          [user.id]
        );

        return {
          success: false,
          message: 'Jeton expiré. Veuillez demander une nouvelle réinitialisation.'
        };
      }

      // Hacher le nouveau mot de passe
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Mettre à jour le mot de passe et supprimer le jeton
      await pool.query(
        'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE id = $2',
        [hashedPassword, user.id]
      );

      logger.info(`Password successfully reset for user: ${user.email}`);

      // Envoyer un email de confirmation
      await emailService.sendPasswordResetConfirmation(user.email, user.name);

      return {
        success: true,
        message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez vous connecter.'
      };
    } catch (error: any) {
      logger.error('Error resetting password:', error);
      return {
        success: false,
        message: 'Une erreur est survenue. Veuillez réessayer.'
      };
    }
  }

  /**
   * Valider un jeton de réinitialisation
   */
  static async validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    try {
      if (!token) {
        return { valid: false };
      }

      // Hacher le jeton fourni
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      // Rechercher l'utilisateur avec ce jeton
      const userResult = await pool.query(
        'SELECT email, reset_token_expires_at FROM users WHERE reset_token = $1 LIMIT 1',
        [hashedToken]
      );

      if (userResult.rows.length === 0) {
        return { valid: false };
      }

      const user = userResult.rows[0];

      // Vérifier que le jeton n'a pas expiré
      if (!user.reset_token_expires_at || new Date(user.reset_token_expires_at) < new Date()) {
        return { valid: false };
      }

      return {
        valid: true,
        email: user.email
      };
    } catch (error: any) {
      logger.error('Error validating reset token:', error);
      return { valid: false };
    }
  }

  /**
   * Générer un OTP et l'envoyer par email
   */
  static async requestPasswordResetOTP(username: string): Promise<{ success: boolean; message: string }> {
    try {
      // Vérifier que l'utilisateur existe par username
      const userResult = await pool.query(
        'SELECT id, email, username, name, two_fa_enabled FROM users WHERE username = $1 LIMIT 1',
        [username]
      );

      if (userResult.rows.length === 0) {
        logger.warn(`OTP password reset requested for non-existent user: ${username}`);
        // Pour des raisons de sécurité, ne pas révéler si l'utilisateur existe
        return {
          success: true,
          message: 'Veuillez entrer votre code OTP 2FA pour réinitialiser votre mot de passe.'
        };
      }

      const user = userResult.rows[0];

      // Vérifier que 2FA est activé
      if (!user.two_fa_enabled) {
        logger.warn(`2FA not enabled for user: ${user.username}`);
        return {
          success: true,
          message: 'Veuillez entrer votre code OTP 2FA pour réinitialiser votre mot de passe.'
        };
      }

      logger.info(`OTP password reset requested for user: ${user.username}`);

      // Juste accepter la demande - l'utilisateur entrera son code 2FA existant
      return {
        success: true,
        message: 'Veuillez entrer votre code OTP 2FA pour réinitialiser votre mot de passe.'
      };
    } catch (error: any) {
      logger.error('Error requesting password reset OTP:', error);
      return {
        success: false,
        message: 'Une erreur est survenue. Veuillez réessayer.'
      };
    }
  }

  /**
   * Valider le OTP et retourner un token de réinitialisation
   */
  static async validateResetOTP(username: string, otp: string): Promise<{ success: boolean; resetToken?: string; message: string }> {
    try {
      if (!username || !otp) {
        return {
          success: false,
          message: 'Nom d\'utilisateur et code OTP requis'
        };
      }

      // Rechercher l'utilisateur avec son secret 2FA
      const userResult = await pool.query(
        'SELECT id, email, username, two_fa_enabled, two_fa_secret FROM users WHERE username = $1 LIMIT 1',
        [username]
      );

      if (userResult.rows.length === 0) {
        logger.warn(`OTP validation for non-existent user: ${username}`);
        return {
          success: false,
          message: 'Utilisateur non trouvé'
        };
      }

      const user = userResult.rows[0];

      // Vérifier que 2FA est activé
      if (!user.two_fa_enabled || !user.two_fa_secret) {
        logger.warn(`2FA not enabled for user: ${user.username}`);
        return {
          success: false,
          message: '2FA non configuré pour cet utilisateur'
        };
      }

      // Valider le code OTP contre le secret 2FA existant
      let isValidOTP = false;
      try {
        isValidOTP = speakeasy.totp.verify({
          secret: user.two_fa_secret,
          encoding: 'base32',
          token: otp,
          window: 2 // Accepter les codes ±30 secondes
        });
      } catch (verifyError: any) {
        logger.error(`Error verifying OTP for user ${user.username}:`, verifyError);
        return {
          success: false,
          message: 'Erreur lors de la vérification du code OTP. Veuillez réessayer.'
        };
      }

      if (!isValidOTP) {
        logger.warn(`Invalid OTP for user: ${user.username}`);
        return {
          success: false,
          message: 'Code OTP invalide'
        };
      }

      // Générer un jeton de réinitialisation
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

      // Sauvegarder le jeton
      await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3',
        [hashedToken, tokenExpiresAt, user.id]
      );

      logger.info(`OTP validated successfully for user: ${user.username}`);

      return {
        success: true,
        resetToken: resetToken,
        message: 'Code OTP valide. Vous pouvez maintenant réinitialiser votre mot de passe.'
      };
    } catch (error: any) {
      logger.error('Error validating OTP:', error);
      return {
        success: false,
        message: 'Une erreur est survenue. Veuillez réessayer.'
      };
    }
  }
}

export default PasswordResetService;
