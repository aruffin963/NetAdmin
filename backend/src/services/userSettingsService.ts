import { pool } from '../config/database';
import { logger } from '../utils/logger';
import axios from 'axios';

export interface UserSettings {
  id: number;
  user_id: number;
  language: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  logRetention: number;
  scanInterval: number;
  exportFormat: string;
  autoBackup: boolean;
  zabbixUrl: string;
  zabbixKey: string;
  webhookUrl: string;
  sessionTimeout: number;
  trustDevices: boolean;
  enableCache: boolean;
  cacheTTL: number;
  created_at: Date;
  updated_at: Date;
}

export class UserSettingsService {
  /**
   * Create table if it doesn't exist
   */
  static async initializeTable(): Promise<void> {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          language VARCHAR(10) DEFAULT 'fr',
          date_format VARCHAR(20) DEFAULT 'dd/mm/yyyy',
          time_format VARCHAR(10) DEFAULT '24h',
          timezone VARCHAR(50) DEFAULT 'Europe/Paris',
          log_retention INTEGER DEFAULT 30,
          scan_interval INTEGER DEFAULT 60,
          export_format VARCHAR(10) DEFAULT 'json',
          auto_backup BOOLEAN DEFAULT true,
          zabbix_url VARCHAR(255),
          zabbix_key VARCHAR(255),
          webhook_url VARCHAR(255),
          session_timeout INTEGER DEFAULT 30,
          trust_devices BOOLEAN DEFAULT true,
          enable_cache BOOLEAN DEFAULT true,
          cache_ttl INTEGER DEFAULT 3600,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      logger.info('user_settings table initialized');
    } catch (error) {
      logger.error('Error initializing user_settings table:', error);
    }
  }

  /**
   * Get user settings or create defaults
   */
  static async getOrCreateSettings(userId: number): Promise<UserSettings> {
    try {
      let result = await pool.query(
        'SELECT * FROM user_settings WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        // Create default settings
        result = await pool.query(
          `INSERT INTO user_settings (user_id) VALUES ($1)
           RETURNING *`,
          [userId]
        );
      }

      return this.formatSettings(result.rows[0]);
    } catch (error) {
      logger.error('Error getting user settings:', error);
      throw error;
    }
  }

  /**
   * Update user settings
   */
  static async updateSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Map camelCase to snake_case
      const fieldMap: { [key: string]: string } = {
        language: 'language',
        dateFormat: 'date_format',
        timeFormat: 'time_format',
        timezone: 'timezone',
        logRetention: 'log_retention',
        scanInterval: 'scan_interval',
        exportFormat: 'export_format',
        autoBackup: 'auto_backup',
        zabbixUrl: 'zabbix_url',
        zabbixKey: 'zabbix_key',
        webhookUrl: 'webhook_url',
        sessionTimeout: 'session_timeout',
        trustDevices: 'trust_devices',
        enableCache: 'enable_cache',
        cacheTTL: 'cache_ttl',
      };

      for (const [key, value] of Object.entries(settings)) {
        if (fieldMap[key] && value !== undefined) {
          updates.push(`${fieldMap[key]} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      if (updates.length === 0) {
        return this.getOrCreateSettings(userId);
      }

      updates.push(`updated_at = NOW()`);
      values.push(userId);

      const result = await pool.query(
        `UPDATE user_settings SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Settings not found');
      }

      return this.formatSettings(result.rows[0]);
    } catch (error) {
      logger.error('Error updating user settings:', error);
      throw error;
    }
  }

  /**
   * Test Zabbix connection
   */
  static async testZabbixConnection(zabbixUrl: string, zabbixKey: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!zabbixUrl || !zabbixKey) {
        return {
          success: false,
          message: 'URL et clé API Zabbix sont requises'
        };
      }

      const response = await axios.post(
        `${zabbixUrl}/api_jsonrpc.php`,
        {
          jsonrpc: '2.0',
          method: 'user.get',
          params: {
            output: ['userid']
          },
          auth: zabbixKey,
          id: 1
        },
        {
          timeout: 5000,
          validateStatus: () => true
        }
      );

      if (response.data && response.data.result) {
        return {
          success: true,
          message: `Connexion Zabbix réussie - ${response.data.result.length} utilisateurs trouvés`
        };
      } else if (response.data?.error) {
        return {
          success: false,
          message: `Erreur Zabbix: ${response.data.error.data || response.data.error}`
        };
      } else {
        return {
          success: false,
          message: 'Impossible de se connecter à Zabbix'
        };
      }
    } catch (error: any) {
      logger.error('Zabbix connection test failed:', error);
      return {
        success: false,
        message: `Erreur de connexion: ${error.message}`
      };
    }
  }

  /**
   * Test webhook
   */
  static async testWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      if (!webhookUrl) {
        return {
          success: false,
          message: 'URL Webhook requise'
        };
      }

      const response = await axios.post(
        webhookUrl,
        {
          test: true,
          timestamp: new Date().toISOString(),
          message: 'Test WebHook de Netadmin'
        },
        {
          timeout: 5000,
          validateStatus: () => true
        }
      );

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: `Webhook réussi (${response.status})`
        };
      } else {
        return {
          success: false,
          message: `Erreur Webhook (${response.status}): ${response.statusText}`
        };
      }
    } catch (error: any) {
      logger.error('Webhook test failed:', error);
      return {
        success: false,
        message: `Erreur: ${error.message}`
      };
    }
  }

  /**
   * Format database response to camelCase
   */
  private static formatSettings(row: any): UserSettings {
    return {
      id: row.id,
      user_id: row.user_id,
      language: row.language,
      dateFormat: row.date_format,
      timeFormat: row.time_format,
      timezone: row.timezone,
      logRetention: row.log_retention,
      scanInterval: row.scan_interval,
      exportFormat: row.export_format,
      autoBackup: row.auto_backup,
      zabbixUrl: row.zabbix_url,
      zabbixKey: row.zabbix_key,
      webhookUrl: row.webhook_url,
      sessionTimeout: row.session_timeout,
      trustDevices: row.trust_devices,
      enableCache: row.enable_cache,
      cacheTTL: row.cache_ttl,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export default UserSettingsService;
