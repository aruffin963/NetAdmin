// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_BASE_URL = API_URL;
export const AGENTLESS_API = `${API_BASE_URL}/agentless`;
