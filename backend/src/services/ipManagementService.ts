/**
 * Service de gestion IP avec base de données - NetAdmin Pro
 * CRUD pour pools IP, adresses et sous-réseaux
 */

import { DatabaseService } from '../config/database';
import { logger } from '../utils/logger';

// Interfaces pour les entités de base de données
export interface IpPool {
  id: number;
  name: string;
  network: string;
  subnet_mask: string;
  gateway?: string;
  dns_servers: string[];
  organization_id: number;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  // Propriétés calculées
  total_addresses?: number;
  allocated_addresses?: number;
  available_addresses?: number;
  utilization?: number;
}

export interface IpAddress {
  id: number;
  ip_address: string;
  pool_id: number;
  status: 'available' | 'allocated' | 'reserved' | 'blocked';
  hostname?: string;
  mac_address?: string;
  description?: string;
  allocated_to?: string;
  allocated_at?: Date;
  created_at: Date;
  updated_at: Date;
  // Relations
  pool_name?: string;
}

export interface Subnet {
  id: number;
  name: string;
  network: string;
  cidr: number;
  gateway?: string;
  vlan_id?: number;
  description?: string;
  organization_id: number;
  created_at: Date;
  updated_at: Date;
}

// DTOs pour les créations/mises à jour
export interface CreatePoolDto {
  name: string;
  network: string; // Format CIDR: 192.168.1.0/24
  gateway?: string;
  dns_servers?: string[];
  organization_id: number;
  description?: string;
}

export interface UpdatePoolDto {
  name?: string;
  gateway?: string;
  dns_servers?: string[];
  description?: string;
  is_active?: boolean;
}

export interface CreateAddressDto {
  ip_address?: string; // Auto-assigné si non fourni
  pool_id: number;
  hostname?: string;
  mac_address?: string;
  description?: string;
  allocated_to?: string;
}

export interface CreateSubnetDto {
  name: string;
  network: string;
  cidr: number;
  gateway?: string;
  vlan_id?: number;
  description?: string;
  organization_id: number;
}

export class IpManagementService {

  // ===================================
  // GESTION DES POOLS IP
  // ===================================

  /**
   * Récupérer tous les pools IP avec statistiques
   */
  static async getAllPools(organizationId?: number): Promise<IpPool[]> {
    try {
      let query = `
        SELECT 
          p.*,
          COUNT(ip.id)::int as total_addresses,
          COUNT(CASE WHEN ip.status = 'allocated' THEN 1 END)::int as allocated_addresses,
          COUNT(CASE WHEN ip.status = 'available' THEN 1 END)::int as available_addresses
        FROM ip_pools p
        LEFT JOIN ip_addresses ip ON p.id = ip.pool_id
      `;
      
      const params: any[] = [];
      
      if (organizationId) {
        query += ` WHERE p.organization_id = $1`;
        params.push(organizationId);
      }
      
      query += `
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;

      const result = await DatabaseService.query(query, params);
      
      return result.rows.map(row => ({
        ...row,
        dns_servers: Array.isArray(row.dns_servers) ? row.dns_servers : JSON.parse(row.dns_servers || '[]'),
        total_addresses: row.total_addresses || 0,
        allocated_addresses: row.allocated_addresses || 0,
        available_addresses: row.available_addresses || 0,
        utilization: row.total_addresses > 0 ? 
          Math.round((row.allocated_addresses / row.total_addresses) * 100) : 0
      }));
    } catch (error) {
      logger.error('Erreur lors de la récupération des pools IP:', error);
      throw error;
    }
  }

  /**
   * Récupérer un pool IP par ID
   */
  static async getPoolById(id: number): Promise<IpPool | null> {
    try {
      const result = await DatabaseService.query(
        'SELECT * FROM ip_pools WHERE id = $1',
        [id]
      );
      
      if (result.rows.length === 0) return null;
      
      const pool = result.rows[0];
      return {
        ...pool,
        dns_servers: Array.isArray(pool.dns_servers) ? pool.dns_servers : JSON.parse(pool.dns_servers || '[]')
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération du pool IP:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau pool IP
   */
  static async createPool(data: CreatePoolDto): Promise<IpPool> {
    try {
      // Extraire le réseau et le masque du CIDR
      const [network, cidr] = data.network.split('/');
      const subnetMask = this.cidrToSubnetMask(parseInt(cidr));

      const result = await DatabaseService.query(`
        INSERT INTO ip_pools (name, network, subnet_mask, gateway, dns_servers, organization_id, description)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        data.name,
        data.network,
        subnetMask,
        data.gateway,
        JSON.stringify(data.dns_servers || []),
        data.organization_id,
        data.description
      ]);

      const pool = result.rows[0];
      
      // Générer automatiquement les adresses IP pour ce pool
      await this.generateAddressesForPool(pool.id, data.network);
      
      logger.info(`Pool IP créé: ${pool.name} (${pool.network})`);
      
      return {
        ...pool,
        dns_servers: JSON.parse(pool.dns_servers || '[]')
      };
    } catch (error) {
      logger.error('Erreur lors de la création du pool IP:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un pool IP
   */
  static async updatePool(id: number, data: UpdatePoolDto): Promise<IpPool | null> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.gateway !== undefined) {
        updates.push(`gateway = $${paramIndex++}`);
        values.push(data.gateway);
      }
      if (data.dns_servers !== undefined) {
        updates.push(`dns_servers = $${paramIndex++}`);
        values.push(JSON.stringify(data.dns_servers));
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(data.is_active);
      }

      if (updates.length === 0) {
        throw new Error('Aucune donnée à mettre à jour');
      }

      values.push(id);

      const result = await DatabaseService.query(`
        UPDATE ip_pools 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      if (result.rows.length === 0) return null;

      const pool = result.rows[0];
      logger.info(`Pool IP mis à jour: ${pool.name}`);

      return {
        ...pool,
        dns_servers: JSON.parse(pool.dns_servers || '[]')
      };
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du pool IP:', error);
      throw error;
    }
  }

  /**
   * Supprimer un pool IP
   */
  static async deletePool(id: number): Promise<boolean> {
    try {
      // Vérifier s'il y a des adresses allouées
      const allocatedCount = await DatabaseService.query(
        'SELECT COUNT(*) FROM ip_addresses WHERE pool_id = $1 AND status = $2',
        [id, 'allocated']
      );

      if (parseInt(allocatedCount.rows[0].count) > 0) {
        throw new Error('Impossible de supprimer un pool avec des adresses allouées');
      }

      await DatabaseService.transaction(async (client) => {
        // Supprimer d'abord toutes les adresses IP du pool
        await client.query('DELETE FROM ip_addresses WHERE pool_id = $1', [id]);
        
        // Puis supprimer le pool
        const result = await client.query('DELETE FROM ip_pools WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
          throw new Error('Pool non trouvé');
        }
      });

      logger.info(`Pool IP supprimé: ID ${id}`);
      return true;
    } catch (error) {
      logger.error('Erreur lors de la suppression du pool IP:', error);
      throw error;
    }
  }

  // ===================================
  // GESTION DES ADRESSES IP
  // ===================================

  /**
   * Récupérer les adresses IP d'un pool
   */
  static async getAddressesByPool(poolId: number, status?: string, limit?: number, offset?: number): Promise<{addresses: IpAddress[], total: number}> {
    try {
      let query = `
        SELECT ip.*, p.name as pool_name
        FROM ip_addresses ip
        JOIN ip_pools p ON ip.pool_id = p.id
        WHERE ip.pool_id = $1
      `;
      
      const params: any[] = [poolId];
      let paramIndex = 2;
      
      if (status) {
        query += ` AND ip.status = $${paramIndex++}`;
        params.push(status);
      }
      
      // Compter le total
      const countQuery = query.replace('SELECT ip.*, p.name as pool_name', 'SELECT COUNT(*)');
      const countResult = await DatabaseService.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);
      
      // Ajouter pagination
      query += ` ORDER BY inet(ip.ip_address)`;
      
      if (limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(limit);
      }
      
      if (offset) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(offset);
      }

      const result = await DatabaseService.query(query, params);
      return {
        addresses: result.rows,
        total
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des adresses IP:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle adresse IP
   */
  static async createAddress(data: CreateAddressDto): Promise<IpAddress> {
    try {
      let ipAddress: string | undefined = data.ip_address;
      
      // Si aucune IP spécifiée, trouver la prochaine disponible
      if (!ipAddress) {
        const nextIp = await this.findNextAvailableIp(data.pool_id);
        if (!nextIp) {
          throw new Error('Aucune adresse IP disponible dans ce pool');
        }
        ipAddress = nextIp;
      }

      const result = await DatabaseService.query(`
        INSERT INTO ip_addresses (ip_address, pool_id, hostname, mac_address, description, allocated_to, status, allocated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        ipAddress,
        data.pool_id,
        data.hostname,
        data.mac_address,
        data.description,
        data.allocated_to,
        data.allocated_to ? 'allocated' : 'available',
        data.allocated_to ? new Date() : null
      ]);

      logger.info(`Adresse IP créée: ${ipAddress}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Erreur lors de la création de l\'adresse IP:', error);
      throw error;
    }
  }

  /**
   * Allouer une adresse IP
   */
  static async allocateAddress(id: number, allocatedTo: string, hostname?: string): Promise<IpAddress | null> {
    try {
      const result = await DatabaseService.query(`
        UPDATE ip_addresses 
        SET status = 'allocated', allocated_to = $2, allocated_at = CURRENT_TIMESTAMP, hostname = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'available'
        RETURNING *
      `, [id, allocatedTo, hostname]);

      if (result.rows.length === 0) return null;

      logger.info(`Adresse IP allouée: ${result.rows[0].ip_address} à ${allocatedTo}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Erreur lors de l\'allocation de l\'adresse IP:', error);
      throw error;
    }
  }

  /**
   * Libérer une adresse IP
   */
  static async releaseAddress(id: number): Promise<IpAddress | null> {
    try {
      const result = await DatabaseService.query(`
        UPDATE ip_addresses 
        SET status = 'available', allocated_to = NULL, allocated_at = NULL, hostname = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [id]);

      if (result.rows.length === 0) return null;

      logger.info(`Adresse IP libérée: ${result.rows[0].ip_address}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Erreur lors de la libération de l\'adresse IP:', error);
      throw error;
    }
  }

  // ===================================
  // GESTION DES SOUS-RÉSEAUX
  // ===================================

  /**
   * Récupérer tous les sous-réseaux
   */
  static async getAllSubnets(organizationId?: number): Promise<Subnet[]> {
    try {
      let query = 'SELECT * FROM subnets';
      const params: any[] = [];
      
      if (organizationId) {
        query += ' WHERE organization_id = $1';
        params.push(organizationId);
      }
      
      query += ' ORDER BY name';

      const result = await DatabaseService.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Erreur lors de la récupération des sous-réseaux:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau sous-réseau
   */
  static async createSubnet(data: CreateSubnetDto): Promise<Subnet> {
    try {
      const result = await DatabaseService.query(`
        INSERT INTO subnets (name, network, cidr, gateway, vlan_id, description, organization_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        data.name,
        data.network,
        data.cidr,
        data.gateway,
        data.vlan_id,
        data.description,
        data.organization_id
      ]);

      logger.info(`Sous-réseau créé: ${data.name} (${data.network}/${data.cidr})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Erreur lors de la création du sous-réseau:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un sous-réseau
   */
  static async updateSubnet(id: number, data: Partial<CreateSubnetDto>): Promise<Subnet | null> {
    try {
      // Construire la requête dynamiquement
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.network !== undefined) {
        fields.push(`network = $${paramIndex++}`);
        values.push(data.network);
      }
      if (data.cidr !== undefined) {
        fields.push(`cidr = $${paramIndex++}`);
        values.push(data.cidr);
      }
      if (data.gateway !== undefined) {
        fields.push(`gateway = $${paramIndex++}`);
        values.push(data.gateway);
      }
      if (data.vlan_id !== undefined) {
        fields.push(`vlan_id = $${paramIndex++}`);
        values.push(data.vlan_id);
      }
      if (data.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }

      if (fields.length === 0) {
        return null;
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const result = await DatabaseService.query(`
        UPDATE subnets
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      if (result.rows.length === 0) {
        return null;
      }

      logger.info(`Sous-réseau mis à jour: ${result.rows[0].name} (ID: ${id})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du sous-réseau:', error);
      throw error;
    }
  }

  /**
   * Supprimer un sous-réseau
   */
  static async deleteSubnet(id: number): Promise<boolean> {
    try {
      const result = await DatabaseService.query(`
        DELETE FROM subnets
        WHERE id = $1
        RETURNING id
      `, [id]);

      if (result.rows.length === 0) {
        return false;
      }

      logger.info(`Sous-réseau supprimé: ID ${id}`);
      return true;
    } catch (error) {
      logger.error('Erreur lors de la suppression du sous-réseau:', error);
      throw error;
    }
  }

  // ===================================
  // STATISTIQUES
  // ===================================

  /**
   * Obtenir les statistiques IP globales
   */
  static async getIpStatistics(organizationId?: number): Promise<any> {
    try {
      let whereClause = '';
      const params: any[] = [];
      
      if (organizationId) {
        whereClause = 'WHERE p.organization_id = $1';
        params.push(organizationId);
      }

      const result = await DatabaseService.query(`
        SELECT 
          COUNT(DISTINCT p.id)::int as total_pools,
          COUNT(ip.id)::int as total_addresses,
          COUNT(CASE WHEN ip.status = 'allocated' THEN 1 END)::int as allocated_addresses,
          COUNT(CASE WHEN ip.status = 'available' THEN 1 END)::int as available_addresses,
          COUNT(CASE WHEN ip.status = 'reserved' THEN 1 END)::int as reserved_addresses
        FROM ip_pools p
        LEFT JOIN ip_addresses ip ON p.id = ip.pool_id
        ${whereClause}
      `, params);

      const stats = result.rows[0];
      const totalAddresses = stats.total_addresses || 0;
      const allocatedAddresses = stats.allocated_addresses || 0;

      return {
        total_pools: stats.total_pools || 0,
        total_addresses: totalAddresses,
        allocated_addresses: allocatedAddresses,
        available_addresses: stats.available_addresses || 0,
        reserved_addresses: stats.reserved_addresses || 0,
        utilization_percentage: totalAddresses > 0 ? 
          Math.round((allocatedAddresses / totalAddresses) * 100) : 0
      };
    } catch (error) {
      logger.error('Erreur lors du calcul des statistiques IP:', error);
      throw error;
    }
  }

  // ===================================
  // UTILITAIRES PRIVÉES
  // ===================================

  /**
   * Générer automatiquement les adresses IP pour un pool
   */
  private static async generateAddressesForPool(poolId: number, network: string): Promise<void> {
    try {
      const addresses = this.calculateNetworkAddresses(network);
      
      // Insérer en lots pour de meilleures performances
      const batchSize = 100;
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        const values = batch.map((ip, index) => `($1, $${index + 2}, 'available')`).join(', ');
        const params = [poolId, ...batch];
        
        await DatabaseService.query(`
          INSERT INTO ip_addresses (pool_id, ip_address, status)
          VALUES ${values}
          ON CONFLICT (ip_address) DO NOTHING
        `, params);
      }

      logger.info(`${addresses.length} adresses générées pour le pool ${poolId}`);
    } catch (error) {
      logger.error('Erreur lors de la génération des adresses:', error);
      throw error;
    }
  }

  /**
   * Calculer les adresses d'un réseau CIDR
   */
  private static calculateNetworkAddresses(cidr: string): string[] {
    const [network, prefixLength] = cidr.split('/');
    const prefix = parseInt(prefixLength);
    const hostBits = 32 - prefix;
    const totalHosts = Math.pow(2, hostBits);
    
    // Convertir l'IP en nombre
    const networkParts = network.split('.').map(Number);
    const networkNum = (networkParts[0] << 24) + (networkParts[1] << 16) + (networkParts[2] << 8) + networkParts[3];
    
    const addresses: string[] = [];
    
    // Générer toutes les adresses utilisables (exclure réseau et broadcast)
    const maxAddresses = Math.min(totalHosts - 2, 1000); // Limiter à 1000 pour éviter les gros réseaux
    for (let i = 1; i <= maxAddresses; i++) {
      const hostNum = networkNum + i;
      const ip = [
        (hostNum >>> 24) & 255,
        (hostNum >>> 16) & 255,
        (hostNum >>> 8) & 255,
        hostNum & 255
      ].join('.');
      addresses.push(ip);
    }
    
    return addresses;
  }

  /**
   * Trouver la prochaine IP disponible dans un pool
   */
  private static async findNextAvailableIp(poolId: number): Promise<string | null> {
    try {
      const result = await DatabaseService.query(`
        SELECT ip_address 
        FROM ip_addresses 
        WHERE pool_id = $1 AND status = 'available'
        ORDER BY inet(ip_address)
        LIMIT 1
      `, [poolId]);

      return result.rows.length > 0 ? result.rows[0].ip_address : null;
    } catch (error) {
      logger.error('Erreur lors de la recherche d\'IP disponible:', error);
      throw error;
    }
  }

  /**
   * Convertir CIDR en masque de sous-réseau
   */
  private static cidrToSubnetMask(cidr: number): string {
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    return [
      (mask >>> 24) & 255,
      (mask >>> 16) & 255,
      (mask >>> 8) & 255,
      mask & 255
    ].join('.');
  }
}

export default IpManagementService;