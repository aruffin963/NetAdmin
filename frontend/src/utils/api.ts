import axios from 'axios';

// Configuration de l'API client
const API_BASE_URL = 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
});

// Intercepteur pour les requêtes
apiClient.interceptors.request.use(
  (config) => {
    // Sessions gérées automatiquement avec withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses (gestion des erreurs)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Session expirée ou invalide
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;