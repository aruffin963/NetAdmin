import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Configuration de l'API
const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Types pour les adresses IP (alignés avec le backend)
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
  pool_name?: string;
}

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

export interface CreateIpAddressRequest {
  pool_id: number;
  ip_address?: string;
  hostname?: string;
  mac_address?: string;
  description?: string;
  allocated_to?: string;
}

export interface UpdateIpAddressRequest extends Partial<CreateIpAddressRequest> {
  status?: 'available' | 'allocated' | 'reserved' | 'blocked';
}

export interface CreateIpPoolRequest {
  name: string;
  network: string; // Format CIDR: 192.168.1.0/24
  gateway?: string;
  dns_servers?: string[];
  organization_id: number;
  description?: string;
}

export interface UpdateIpPoolRequest extends Partial<CreateIpPoolRequest> {}

export interface CreateSubnetRequest {
  name: string;
  network: string;
  cidr: number;
  gateway?: string;
  vlan_id?: number;
  description?: string;
  organization_id: number;
}

export interface UpdateSubnetRequest extends Partial<CreateSubnetRequest> {}

// Clés de requête pour React Query
export const queryKeys = {
  ipAddresses: ['ipAddresses'] as const,
  ipAddress: (id: number) => ['ipAddresses', id] as const,
  ipPools: ['ipPools'] as const,
  ipPool: (id: number) => ['ipPools', id] as const,
  subnets: ['subnets'] as const,
  subnet: (id: number) => ['subnets', id] as const,
};

// ================================
// HOOKS POUR LES ADRESSES IP
// ================================

// Récupérer toutes les adresses IP d'un pool
export const useIpAddresses = (poolId?: number) => {
  return useQuery({
    queryKey: poolId ? [...queryKeys.ipAddresses, { poolId }] : queryKeys.ipAddresses,
    queryFn: async (): Promise<IpAddress[]> => {
      if (poolId) {
        const response = await api.get(`/ip/pools/${poolId}/addresses`);
        return response.data.data || response.data;
      } else {
        // Si pas de poolId, retourner un tableau vide ou implémenter une route globale
        return [];
      }
    },
    staleTime: 30000, // 30 secondes
    gcTime: 300000, // 5 minutes
    enabled: !!poolId, // Seulement si poolId est fourni
  });
};

// Récupérer une adresse IP spécifique
export const useIpAddress = (id: number) => {
  return useQuery({
    queryKey: queryKeys.ipAddress(id),
    queryFn: async (): Promise<IpAddress> => {
      const response = await api.get(`/ip/addresses/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

// Créer une nouvelle adresse IP
export const useCreateIpAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIpAddressRequest): Promise<IpAddress> => {
      const response = await api.post('/ip/addresses', data);
      return response.data.data;
    },
    onSuccess: (newAddress: IpAddress) => {
      // Invalider et refetch les listes d'adresses IP
      queryClient.invalidateQueries({ queryKey: queryKeys.ipAddresses });
      
      // Invalider les pools pour mettre à jour les statistiques
      queryClient.invalidateQueries({ queryKey: queryKeys.ipPools });
      
      // Ajouter la nouvelle adresse au cache
      queryClient.setQueryData(queryKeys.ipAddress(newAddress.id), newAddress);
    },
  });
};

// Allouer une adresse IP
export const useAllocateIpAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, allocated_to, hostname }: { id: number; allocated_to: string; hostname?: string }): Promise<IpAddress> => {
      const response = await api.put(`/ip/addresses/${id}/allocate`, { allocated_to, hostname });
      return response.data.data;
    },
    onSuccess: (allocatedAddress: IpAddress) => {
      // Mettre à jour le cache
      queryClient.setQueryData(queryKeys.ipAddress(allocatedAddress.id), allocatedAddress);
      queryClient.invalidateQueries({ queryKey: queryKeys.ipAddresses });
      queryClient.invalidateQueries({ queryKey: queryKeys.ipPools });
    },
  });
};

// Libérer une adresse IP
export const useReleaseIpAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<IpAddress> => {
      const response = await api.put(`/ip/addresses/${id}/release`);
      return response.data.data;
    },
    onSuccess: (releasedAddress: IpAddress) => {
      // Mettre à jour le cache
      queryClient.setQueryData(queryKeys.ipAddress(releasedAddress.id), releasedAddress);
      queryClient.invalidateQueries({ queryKey: queryKeys.ipAddresses });
      queryClient.invalidateQueries({ queryKey: queryKeys.ipPools });
    },
  });
};

// ================================
// HOOKS POUR LES POOLS IP
// ================================

// Récupérer tous les pools IP
export const useIpPools = () => {
  return useQuery({
    queryKey: queryKeys.ipPools,
    queryFn: async (): Promise<IpPool[]> => {
      const response = await api.get('/ip/pools');
      // L'API retourne {success: true, data: [...]}
      return response.data.data || response.data;
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
};

// Récupérer un pool IP spécifique
export const useIpPool = (id: number) => {
  return useQuery({
    queryKey: queryKeys.ipPool(id),
    queryFn: async (): Promise<IpPool> => {
      const response = await api.get(`/ip/pools/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

// Créer un nouveau pool IP
export const useCreateIpPool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIpPoolRequest): Promise<IpPool> => {
      const response = await api.post('/ip/pools', data);
      return response.data.data;
    },
    onSuccess: (newPool: IpPool) => {
      // Invalider et refetch la liste des pools
      queryClient.invalidateQueries({ queryKey: queryKeys.ipPools });
      
      // Ajouter le nouveau pool au cache
      queryClient.setQueryData(queryKeys.ipPool(newPool.id), newPool);
    },
  });
};

// Mettre à jour un pool IP
export const useUpdateIpPool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateIpPoolRequest }): Promise<IpPool> => {
      const response = await api.put(`/ip/pools/${id}`, data);
      return response.data.data;
    },
    onSuccess: (updatedPool: IpPool) => {
      // Mettre à jour le cache du pool spécifique
      queryClient.setQueryData(queryKeys.ipPool(updatedPool.id), updatedPool);
      
      // Invalider la liste des pools
      queryClient.invalidateQueries({ queryKey: queryKeys.ipPools });
    },
  });
};

// Supprimer un pool IP
export const useDeleteIpPool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/ip/pools/${id}`);
    },
    onSuccess: (_: void, deletedId: number) => {
      // Supprimer le pool du cache
      queryClient.removeQueries({ queryKey: queryKeys.ipPool(deletedId) });
      
      // Invalider la liste des pools
      queryClient.invalidateQueries({ queryKey: queryKeys.ipPools });
      
      // Invalider les adresses IP associées
      queryClient.invalidateQueries({ queryKey: queryKeys.ipAddresses });
    },
  });
};

// ================================
// HOOKS POUR LES SOUS-RÉSEAUX
// ================================

// Récupérer tous les sous-réseaux
export const useSubnets = () => {
  return useQuery({
    queryKey: queryKeys.subnets,
    queryFn: async (): Promise<Subnet[]> => {
      const response = await api.get('/ip/subnets');
      return response.data.data || response.data;
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
  });
};

// Récupérer un sous-réseau spécifique
export const useSubnet = (id: number) => {
  return useQuery({
    queryKey: queryKeys.subnet(id),
    queryFn: async (): Promise<Subnet> => {
      const response = await api.get(`/ip/subnets/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
};

// Créer un nouveau sous-réseau
export const useCreateSubnet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubnetRequest): Promise<Subnet> => {
      const response = await api.post('/ip/subnets', data);
      return response.data.data;
    },
    onSuccess: (newSubnet: Subnet) => {
      // Invalider et refetch la liste des sous-réseaux
      queryClient.invalidateQueries({ queryKey: queryKeys.subnets });
      
      // Ajouter le nouveau sous-réseau au cache
      queryClient.setQueryData(queryKeys.subnet(newSubnet.id), newSubnet);
    },
  });
};

// Mettre à jour un sous-réseau
export const useUpdateSubnet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateSubnetRequest }): Promise<Subnet> => {
      const response = await api.put(`/ip/subnets/${id}`, data);
      return response.data.data;
    },
    onSuccess: (updatedSubnet: Subnet) => {
      // Mettre à jour le cache du sous-réseau spécifique
      queryClient.setQueryData(queryKeys.subnet(updatedSubnet.id), updatedSubnet);
      
      // Invalider la liste des sous-réseaux
      queryClient.invalidateQueries({ queryKey: queryKeys.subnets });
    },
  });
};

// Supprimer un sous-réseau
export const useDeleteSubnet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/ip/subnets/${id}`);
    },
    onSuccess: (_: void, deletedId: number) => {
      // Supprimer le sous-réseau du cache
      queryClient.removeQueries({ queryKey: queryKeys.subnet(deletedId) });
      
      // Invalider la liste des sous-réseaux
      queryClient.invalidateQueries({ queryKey: queryKeys.subnets });
    },
  });
};

// ================================
// HOOKS UTILITAIRES
// ================================

// Hook pour scanner un réseau et suggérer des adresses disponibles
export const useScanNetwork = () => {
  return useMutation({
    mutationFn: async (network: string): Promise<string[]> => {
      const response = await api.post('/ip/scan', { network });
      return response.data.availableAddresses;
    },
  });
};

// Hook pour valider un CIDR
export const useValidateCidr = () => {
  return useMutation({
    mutationFn: async (cidr: string): Promise<{ valid: boolean; error?: string; info?: any }> => {
      const response = await api.post('/ip/validate-cidr', { cidr });
      return response.data;
    },
  });
};

export default {
  // IP Addresses
  useIpAddresses,
  useIpAddress,
  useCreateIpAddress,
  useAllocateIpAddress,
  useReleaseIpAddress,
  
  // IP Pools
  useIpPools,
  useIpPool,
  useCreateIpPool,
  useUpdateIpPool,
  useDeleteIpPool,
  
  // Subnets
  useSubnets,
  useSubnet,
  useCreateSubnet,
  useUpdateSubnet,
  useDeleteSubnet,
  
  // Utilities
  useScanNetwork,
  useValidateCidr,
};