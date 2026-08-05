/**
 * Standardized API Response Utilities
 * 
 * Provides consistent response formats across all API endpoints
 * to improve client-side integration and API documentation.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  meta?: Partial<ApiResponse<T>['meta']>
): { statusCode: number; body: ApiResponse<T> } {
  return {
    statusCode,
    body: {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
  };
}

/**
 * Error response helper
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): { statusCode: number; body: ApiResponse } {
  return {
    statusCode,
    body: {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
  };
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  statusCode: number = 200
): { statusCode: number; body: ApiResponse<T[]> } {
  const totalPages = Math.ceil(total / limit);
  return {
    statusCode,
    body: {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    },
  };
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource Not Found
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  
  // Business Logic
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
  
  // Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // CSRF
  CSRF_TOKEN_INVALID: 'CSRF_TOKEN_INVALID',
  CSRF_TOKEN_MISSING: 'CSRF_TOKEN_MISSING',
} as const;

/**
 * HTTP Status Code to Error Code mapping
 */
export const statusCodeToErrorCode: Record<number, string> = {
  400: ErrorCodes.INVALID_INPUT,
  401: ErrorCodes.UNAUTHORIZED,
  403: ErrorCodes.FORBIDDEN,
  404: ErrorCodes.NOT_FOUND,
  409: ErrorCodes.CONFLICT,
  422: ErrorCodes.VALIDATION_ERROR,
  429: ErrorCodes.RATE_LIMIT_EXCEEDED,
  500: ErrorCodes.INTERNAL_ERROR,
  503: ErrorCodes.SERVICE_UNAVAILABLE,
};

/**
 * Express middleware to send standardized responses
 */
export function sendSuccess<T>(
  res: any,
  data: T,
  statusCode: number = 200,
  meta?: Partial<ApiResponse<T>['meta']>
): void {
  const response = successResponse(data, statusCode, meta);
  res.status(response.statusCode).json(response.body);
}

export function sendError(
  res: any,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): void {
  const response = errorResponse(code, message, statusCode, details);
  res.status(response.statusCode).json(response.body);
}

export function sendPaginated<T>(
  res: any,
  data: T[],
  page: number,
  limit: number,
  total: number,
  statusCode: number = 200
): void {
  const response = paginatedResponse(data, page, limit, total, statusCode);
  res.status(response.statusCode).json(response.body);
}

/**
 * Validation error helper
 */
export function validationErrorResponse(
  errors: Record<string, string[]>
): { statusCode: number; body: ApiResponse } {
  return errorResponse(
    ErrorCodes.VALIDATION_ERROR,
    'Validation failed',
    422,
    { errors }
  );
}

/**
 * Not found error helper
 */
export function notFoundResponse(resource: string = 'Resource'): { statusCode: number; body: ApiResponse } {
  return errorResponse(
    ErrorCodes.NOT_FOUND,
    `${resource} not found`,
    404
  );
}

/**
 * Unauthorized error helper
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): { statusCode: number; body: ApiResponse } {
  return errorResponse(
    ErrorCodes.UNAUTHORIZED,
    message,
    401
  );
}

/**
 * Forbidden error helper
 */
export function forbiddenResponse(message: string = 'Forbidden'): { statusCode: number; body: ApiResponse } {
  return errorResponse(
    ErrorCodes.FORBIDDEN,
    message,
    403
  );
}

/**
 * Conflict error helper
 */
export function conflictResponse(message: string = 'Resource conflict'): { statusCode: number; body: ApiResponse } {
  return errorResponse(
    ErrorCodes.CONFLICT,
    message,
    409
  );
}

/**
 * Internal error helper
 */
export function internalErrorResponse(message: string = 'Internal server error', details?: any): { statusCode: number; body: ApiResponse } {
  return errorResponse(
    ErrorCodes.INTERNAL_ERROR,
    message,
    500,
    details
  );
}