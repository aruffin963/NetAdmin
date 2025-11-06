import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Types
export interface Organization {
  id: number;
  name: string;
  domain: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateOrganizationDto {
  name: string;
  domain?: string;
}

// Hook pour récupérer les organisations
export const useOrganizations = () => {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async (): Promise<Organization[]> => {
      const response = await axios.get(`${API_BASE_URL}/organizations`);
      return response.data.data;
    },
  });
};

// Hook pour créer une organisation
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateOrganizationDto): Promise<Organization> => {
      const response = await axios.post(`${API_BASE_URL}/organizations`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['ipPools'] });
    },
    onError: () => {
      // Rafraîchir même en cas d'erreur car l'org peut avoir été créée
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        queryClient.invalidateQueries({ queryKey: ['ipPools'] });
      }, 1000);
    },
  });
};