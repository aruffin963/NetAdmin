import { DatabaseService } from '../config/database';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export interface GeneratePasswordDto {
  application: string;
  username: string;
  length: number;
  secret_key?: string;
  notes?: string;
  created_by?: string;
}

export interface Password {
  id: number;
  application: string;
  username: string;
  password_hash: string;
  secret_key?: string;
  length: number;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  last_accessed_at?: Date;
  notes?: string;
  is_active: boolean;
}

export class PasswordGeneratorService {
  /**
   * Générer un mot de passe sécurisé
   */
  static generateSecurePassword(length: number, secretKey?: string): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    // Si une clé secrète est fournie, l'utiliser comme seed
    if (secretKey) {
      const hash = crypto.createHash('sha256').update(secretKey).digest('hex');
      const seed = parseInt(hash.substring(0, 8), 16);
      const rng = this.seededRandom(seed);
      
      for (let i = 0; i < length; i++) {
        password += charset[Math.floor(rng() * charset.length)];
      }
    } else {
      // Génération aléatoire cryptographiquement sécurisée
      const randomBytes = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length];
      }
    }
    
    return password;
  }

  /**
   * Générateur de nombres pseudo-aléatoires avec seed
   */
  private static seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  /**
   * Générer et sauvegarder un mot de passe
   */
  static async generateAndSave(data: GeneratePasswordDto): Promise<{ password: Password; plainPassword: string }> {
    try {
      // Vérifier si un mot de passe actif existe déjà pour cette application et username
      const existingResult = await DatabaseService.query(`
        SELECT id, application, username FROM passwords 
        WHERE application = $1 AND username = $2 AND is_active = TRUE
        LIMIT 1
      `, [data.application, data.username]);

      if (existingResult.rows.length > 0) {
        throw new Error(`Un mot de passe actif existe déjà pour ${data.application}/${data.username}. Veuillez régénérer l'existant ou le supprimer avant d'en créer un nouveau.`);
      }

      // Générer le mot de passe
      const plainPassword = this.generateSecurePassword(data.length, data.secret_key);
      
      // Hasher le mot de passe pour le stockage
      const password_hash = await bcrypt.hash(plainPassword, 10);

      // Sauvegarder en base de données
      const result = await DatabaseService.query(`
        INSERT INTO passwords (application, username, password_hash, secret_key, length, created_by, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        data.application,
        data.username,
        password_hash,
        data.secret_key,
        data.length,
        data.created_by,
        data.notes
      ]);

      logger.info(`Mot de passe généré pour ${data.application}/${data.username}`);
      
      return {
        password: result.rows[0],
        plainPassword
      };
    } catch (error) {
      logger.error('Erreur lors de la génération du mot de passe:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les mots de passe
   */
  static async getAll(createdBy?: string): Promise<Password[]> {
    try {
      let query = 'SELECT * FROM passwords WHERE is_active = TRUE';
      const params: any[] = [];
      
      if (createdBy) {
        query += ' AND created_by = $1';
        params.push(createdBy);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await DatabaseService.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Erreur lors de la récupération des mots de passe:', error);
      throw error;
    }
  }

  /**
   * Récupérer un mot de passe par ID
   */
  static async getById(id: number): Promise<Password | null> {
    try {
      const result = await DatabaseService.query(`
        UPDATE passwords
        SET last_accessed_at = NOW()
        WHERE id = $1 AND is_active = TRUE
        RETURNING *
      `, [id]);

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      logger.error('Erreur lors de la récupération du mot de passe:', error);
      throw error;
    }
  }

  /**
   * Supprimer un mot de passe (soft delete)
   */
  static async delete(id: number): Promise<boolean> {
    try {
      const result = await DatabaseService.query(`
        UPDATE passwords
        SET is_active = FALSE
        WHERE id = $1
        RETURNING id
      `, [id]);

      if (result.rows.length > 0) {
        logger.info(`Mot de passe supprimé: ID ${id}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Erreur lors de la suppression du mot de passe:', error);
      throw error;
    }
  }

  /**
   * Régénérer un mot de passe
   */
  static async regenerate(id: number): Promise<{ password: Password; plainPassword: string } | null> {
    try {
      // Récupérer l'ancien mot de passe
      const oldPassword = await this.getById(id);
      if (!oldPassword) {
        return null;
      }

      // Générer un nouveau mot de passe
      const plainPassword = this.generateSecurePassword(oldPassword.length, oldPassword.secret_key || undefined);
      const password_hash = await bcrypt.hash(plainPassword, 10);

      // Mettre à jour en base
      const result = await DatabaseService.query(`
        UPDATE passwords
        SET password_hash = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [password_hash, id]);

      logger.info(`Mot de passe régénéré: ID ${id}`);

      return {
        password: result.rows[0],
        plainPassword
      };
    } catch (error) {
      logger.error('Erreur lors de la régénération du mot de passe:', error);
      throw error;
    }
  }
}
