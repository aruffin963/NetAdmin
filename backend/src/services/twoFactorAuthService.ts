import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcryptjs from 'bcryptjs';
import { DatabaseService } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Service pour gérer l'authentification à deux facteurs (2FA) avec TOTP
 * TOTP = Time-based One-Time Password (comme Google Authenticator)
 */
export class TwoFactorAuthService {
  private static readonly TOTP_WINDOW = 1; // Fenêtre de 30 secondes avant/après

  /**
   * Génère un nouveau secret TOTP pour un utilisateur
   */
  static generateSecret(userEmail: string): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: `NetAdmin (${userEmail})`,
      issuer: 'NetAdmin Pro',
      length: 32,
    });

    logger.info(`✅ Generated TOTP secret for ${userEmail}`);

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url || '',
    };
  }

  /**
   * Génère le QR Code en base64
   */
  static async generateQRCodeDataUrl(otpauthUrl: string): Promise<string> {
    try {
      const qrCode = await QRCode.toDataURL(otpauthUrl);
      return qrCode;
    } catch (error) {
      logger.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Vérifie un code TOTP
   */
  static verifyTOTP(secret: string, token: string): boolean {
    try {
      // Trim the token to remove any whitespace
      const cleanToken = (token || '').trim();
      
      // Validate token format (should be 6-8 digits)
      if (!/^\d{6,8}$/.test(cleanToken)) {
        logger.warn(`⚠️  Invalid TOTP token format: ${cleanToken}`);
        return false;
      }

      // Validate secret format (should be base32)
      if (!secret || secret.trim().length === 0) {
        logger.warn(`⚠️  Invalid TOTP secret: empty or null`);
        return false;
      }

      const isValid = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: cleanToken,
        window: this.TOTP_WINDOW,
      });

      if (isValid) {
        logger.info('✅ TOTP token verified successfully');
      } else {
        logger.warn(`⚠️  Invalid TOTP token: secret length=${secret.length}, token=${cleanToken}`);
      }

      return isValid;
    } catch (error) {
      logger.error('Error verifying TOTP:', error);
      return false;
    }
  }

  /**
   * Génère les codes de secours (10 codes aléatoires)
   */
  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Format: XXXX-XXXX-XXXX (12 caractères)
      const code = `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      codes.push(code);
    }

    return codes;
  }

  /**
   * Hache un code de secours pour stockage en BD
   */
  static async hashBackupCode(code: string): Promise<string> {
    return bcryptjs.hash(code, 10);
  }

  /**
   * Compare un code avec son hash
   */
  static async compareBackupCode(code: string, hash: string): Promise<boolean> {
    return bcryptjs.compare(code, hash);
  }

  /**
   * Active le 2FA pour un utilisateur
   */
  static async enableTwoFactorAuth(userId: number, secret: string): Promise<void> {
    const query = `
      INSERT INTO user_totp_settings (user_id, totp_secret, totp_enabled)
      VALUES ($1, $2, true)
      ON CONFLICT (user_id) 
      DO UPDATE SET totp_secret = $2, totp_enabled = true;
    `;

    try {
      await DatabaseService.query(query, [userId, secret]);
      logger.info(`✅ 2FA enabled for user ${userId}`);
    } catch (error) {
      logger.error('Error enabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Désactive le 2FA pour un utilisateur
   */
  static async disableTwoFactorAuth(userId: number): Promise<void> {
    const query = `
      UPDATE user_totp_settings 
      SET totp_enabled = false
      WHERE user_id = $1;
    `;

    try {
      await DatabaseService.query(query, [userId]);
      
      // Supprimer les codes de secours
      const deleteCodesQuery = `DELETE FROM user_backup_codes WHERE user_id = $1;`;
      await DatabaseService.query(deleteCodesQuery, [userId]);

      logger.info(`✅ 2FA disabled for user ${userId}`);
    } catch (error) {
      logger.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Vérifie si le 2FA est activé pour un utilisateur
   */
  static async isTwoFactorEnabled(userId: number): Promise<boolean> {
    const query = `
      SELECT totp_enabled FROM user_totp_settings 
      WHERE user_id = $1;
    `;

    try {
      const result = await DatabaseService.query(query, [userId]);
      return result.rows.length > 0 ? result.rows[0].totp_enabled : false;
    } catch (error) {
      logger.error('Error checking 2FA status:', error);
      return false;
    }
  }

  /**
   * Récupère le statut 2FA d'un utilisateur
   */
  static async get2FAStatus(userId: number): Promise<any> {
    const query = `
      SELECT 
        user_id,
        totp_enabled,
        backup_codes_count,
        created_at,
        last_verified_at
      FROM user_totp_settings 
      WHERE user_id = $1;
    `;

    try {
      const result = await DatabaseService.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting 2FA status:', error);
      return null;
    }
  }

  /**
   * Sauvegarde les codes de secours en BD
   */
  static async saveBackupCodes(userId: number, codes: string[]): Promise<void> {
    // Supprimer les anciens codes
    const deleteQuery = `DELETE FROM user_backup_codes WHERE user_id = $1;`;
    await DatabaseService.query(deleteQuery, [userId]);

    // Sauvegarder les nouveaux codes (hachés)
    for (const code of codes) {
      const hash = await this.hashBackupCode(code);
      const insertQuery = `
        INSERT INTO user_backup_codes (user_id, code_hash, used)
        VALUES ($1, $2, false);
      `;

      try {
        await DatabaseService.query(insertQuery, [userId, hash]);
      } catch (error) {
        logger.error(`Error saving backup code for user ${userId}:`, error);
      }
    }

    // Mettre à jour le compteur
    const updateQuery = `
      UPDATE user_totp_settings 
      SET backup_codes_count = $1 
      WHERE user_id = $2;
    `;
    await DatabaseService.query(updateQuery, [codes.length, userId]);

    logger.info(`✅ Saved ${codes.length} backup codes for user ${userId}`);
  }

  /**
   * Récupère les codes de secours d'un utilisateur (sans hashes)
   * Pour affichage au user seulement
   */
  static async getBackupCodesCount(userId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count FROM user_backup_codes 
      WHERE user_id = $1 AND used = false;
    `;

    try {
      const result = await DatabaseService.query(query, [userId]);
      return parseInt(result.rows[0].count) || 0;
    } catch (error) {
      logger.error('Error getting backup codes count:', error);
      return 0;
    }
  }

  /**
   * Vérifie et utilise un code de secours
   */
  static async verifyAndUseBackupCode(userId: number, code: string): Promise<boolean> {
    const query = `
      SELECT id, code_hash FROM user_backup_codes 
      WHERE user_id = $1 AND used = false;
    `;

    try {
      const result = await DatabaseService.query(query, [userId]);

      for (const row of result.rows) {
        const isMatch = await this.compareBackupCode(code, row.code_hash);
        
        if (isMatch) {
          // Marquer le code comme utilisé
          const updateQuery = `
            UPDATE user_backup_codes 
            SET used = true, used_at = NOW() 
            WHERE id = $1;
          `;
          await DatabaseService.query(updateQuery, [row.id]);

          logger.info(`✅ Backup code used by user ${userId}`);
          return true;
        }
      }

      logger.warn(`⚠️  Invalid backup code attempt by user ${userId}`);
      return false;
    } catch (error) {
      logger.error('Error verifying backup code:', error);
      return false;
    }
  }

  /**
   * Enregistre une tentative de login 2FA
   */
  static async recordLoginAttempt(
    userId: number,
    success: boolean,
    method: 'totp' | 'backup_code',
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const query = `
      INSERT INTO totp_login_history (user_id, success, method, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5);
    `;

    try {
      await DatabaseService.query(query, [userId, success, method, ipAddress, userAgent]);

      if (success) {
        // Mettre à jour last_2fa_verification dans users
        const updateQuery = `
          UPDATE users 
          SET last_2fa_verification = NOW() 
          WHERE id = $1;
        `;
        await DatabaseService.query(updateQuery, [userId]);
      }
    } catch (error) {
      logger.error('Error recording login attempt:', error);
    }
  }

  /**
   * Récupère l'historique des logins 2FA
   */
  static async getLoginHistory(userId: number, limit: number = 20): Promise<any[]> {
    const query = `
      SELECT 
        id,
        success,
        method,
        ip_address,
        timestamp
      FROM totp_login_history 
      WHERE user_id = $1 
      ORDER BY timestamp DESC 
      LIMIT $2;
    `;

    try {
      const result = await DatabaseService.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting login history:', error);
      return [];
    }
  }

  /**
   * Récupère le secret TOTP d'un utilisateur
   */
  static async getTOTPSecret(userId: number): Promise<string | null> {
    const query = `
      SELECT totp_secret FROM user_totp_settings 
      WHERE user_id = $1;
    `;

    try {
      const result = await DatabaseService.query(query, [userId]);
      return result.rows[0]?.totp_secret || null;
    } catch (error) {
      logger.error('Error getting TOTP secret:', error);
      return null;
    }
  }
}

export default TwoFactorAuthService;
