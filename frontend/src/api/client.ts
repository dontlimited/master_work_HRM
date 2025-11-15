import axios from 'axios';
import { store } from '../store/store';
import { analyzeApiError } from '../utils/apiErrorHandler';

// Use direct backend URL to avoid any local proxy issues
export const api = axios.create({ baseURL: 'http://localhost:5050/api/v1' });

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor for error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error details for debugging
    const errorInfo = analyzeApiError(error);
    
    // Connection errors are common when backend is not running, log as warning
    if (errorInfo.type === 'CONNECTION_ERROR') {
      console.warn('API Connection Error:', {
        url: error.config?.url,
        method: error.config?.method,
        message: errorInfo.message,
      });
    } else {
      // Other errors are logged as errors
      console.error('API Request Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: errorInfo.statusCode,
        type: errorInfo.type,
        message: errorInfo.message,
      });
    }
    
    // Re-throw error so it can be handled by component-level error handlers
    return Promise.reject(error);
  }
);


