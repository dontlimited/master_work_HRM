/**
 * Utility functions for handling API errors
 */

export type ApiErrorType = 
  | 'CONNECTION_ERROR' 
  | 'NOT_FOUND' 
  | 'SERVER_ERROR' 
  | 'UNAUTHORIZED' 
  | 'FORBIDDEN' 
  | 'BAD_REQUEST' 
  | 'UNKNOWN';

export interface ApiErrorInfo {
  type: ApiErrorType;
  message: string;
  statusCode?: number;
  originalError: any;
}

/**
 * Checks if error is a connection error (network issues, server not running)
 */
export const isConnectionError = (error: any): boolean => {
  if (!error) return false;
  
  // Check axios error codes
  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // Check error message
  const message = error.message || '';
  if (
    message.includes('CONNECTION_REFUSED') ||
    message.includes('Network Error') ||
    message.includes('Failed to fetch') ||
    message.includes('ERR_CONNECTION_REFUSED')
  ) {
    return true;
  }
  
  // Check if request failed (no response)
  if (error.request && !error.response) {
    return true;
  }
  
  return false;
};

/**
 * Checks if error is a server error (500, 502, 503, 504)
 */
export const isServerError = (error: any): boolean => {
  if (!error) return false;
  const status = error?.response?.status;
  return status >= 500 && status < 600;
};

/**
 * Checks if error is a not found error (404)
 */
export const isNotFoundError = (error: any): boolean => {
  if (!error) return false;
  return error?.response?.status === 404;
};

/**
 * Checks if error is an unauthorized error (401)
 */
export const isUnauthorizedError = (error: any): boolean => {
  if (!error) return false;
  return error?.response?.status === 401;
};

/**
 * Checks if error is a forbidden error (403)
 */
export const isForbiddenError = (error: any): boolean => {
  if (!error) return false;
  return error?.response?.status === 403;
};

/**
 * Checks if error is a bad request error (400)
 */
export const isBadRequestError = (error: any): boolean => {
  if (!error) return false;
  return error?.response?.status === 400;
};

/**
 * Analyzes an error and returns structured error information
 */
export const analyzeApiError = (error: any): ApiErrorInfo => {
  if (isConnectionError(error)) {
    return {
      type: 'CONNECTION_ERROR',
      message: 'Unable to connect to server. Please make sure the backend is running.',
      originalError: error,
    };
  }

  if (isNotFoundError(error)) {
    return {
      type: 'NOT_FOUND',
      message: 'The requested resource was not found. The API endpoint may not exist.',
      statusCode: 404,
      originalError: error,
    };
  }

  if (isServerError(error)) {
    const status = error?.response?.status;
    let message = 'Server error occurred. Please try again later.';
    
    if (status === 500) {
      message = 'Internal server error. The server encountered an unexpected condition.';
    } else if (status === 502) {
      message = 'Bad gateway. The server received an invalid response from upstream.';
    } else if (status === 503) {
      message = 'Service unavailable. The server is temporarily unable to handle the request.';
    } else if (status === 504) {
      message = 'Gateway timeout. The server did not receive a timely response.';
    }

    return {
      type: 'SERVER_ERROR',
      message,
      statusCode: status,
      originalError: error,
    };
  }

  if (isUnauthorizedError(error)) {
    return {
      type: 'UNAUTHORIZED',
      message: 'Unauthorized. Please log in again.',
      statusCode: 401,
      originalError: error,
    };
  }

  if (isForbiddenError(error)) {
    return {
      type: 'FORBIDDEN',
      message: 'Access forbidden. You do not have permission to perform this action.',
      statusCode: 403,
      originalError: error,
    };
  }

  if (isBadRequestError(error)) {
    const serverMessage = error?.response?.data?.error || error?.response?.data?.message;
    return {
      type: 'BAD_REQUEST',
      message: serverMessage || 'Invalid request. Please check your input.',
      statusCode: 400,
      originalError: error,
    };
  }

  // Try to extract message from response
  const serverMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message;
  
  return {
    type: 'UNKNOWN',
    message: serverMessage || 'An unexpected error occurred. Please try again.',
    statusCode: error?.response?.status,
    originalError: error,
  };
};

/**
 * Gets a user-friendly error message for display
 */
export const getErrorMessage = (error: any): string => {
  const errorInfo = analyzeApiError(error);
  return errorInfo.message;
};

/**
 * Handles API error and shows appropriate message to user
 * Note: Error logging is handled by the axios interceptor in client.ts
 */
export const handleApiError = (error: any, customMessage?: string): void => {
  const errorInfo = analyzeApiError(error);
  const message = customMessage || errorInfo.message;
  
  // Show alert to user (error is already logged by interceptor)
  alert(message);
};

