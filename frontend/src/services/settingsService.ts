import { apiClient } from './api';

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

export class SettingsService {
  /**
   * Get user settings
   */
  static async getSettings(): Promise<UserSettings> {
    try {
      const response = await apiClient.get<UserSettings>('/settings');
      return response as UserSettings || {};
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  /**
   * Update user settings
   */
  static async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      const response = await apiClient.post<UserSettings>('/settings', settings);
      return response as UserSettings || {};
    } catch (error: any) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Test Zabbix connection
   */
  static async testZabbixConnection(zabbixUrl: string, zabbixKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/settings/test-zabbix', {
        zabbixUrl,
        zabbixKey
      });
      return {
        success: (response as any)?.success || false,
        message: (response as any)?.message || 'Connection test completed'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de connexion'
      };
    }
  }

  /**
   * Test webhook
   */
  static async testWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/settings/test-webhook', {
        webhookUrl
      });
      return {
        success: (response as any)?.success || false,
        message: (response as any)?.message || 'Webhook test completed'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de connexion'
      };
    }
  }

  /**
   * Clear cache
   */
  static async clearCache(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>('/settings/clear-cache', {});
      return {
        success: (response as any)?.success || false,
        message: (response as any)?.message || 'Cache cleared'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur'
      };
    }
  }
}

export default SettingsService;
