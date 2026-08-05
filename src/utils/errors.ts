/**
 * Custom error classes for better error handling and categorization
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: any,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
      },
    };
  }
}

// Client Errors (4xx)
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: any) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: any) {
    super(401, message, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: any) {
    super(403, message, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: any) {
    super(404, message, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: any) {
    super(409, message, 'CONFLICT', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error', details?: any) {
    super(422, message, 'VALIDATION_ERROR', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', details?: any) {
    super(429, message, 'RATE_LIMIT_EXCEEDED', details);
  }
}

// Server Errors (5xx)
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details?: any) {
    super(500, message, 'INTERNAL_ERROR', details, false);
  }
}

export class BadGatewayError extends AppError {
  constructor(message = 'Bad gateway', details?: any) {
    super(502, message, 'BAD_GATEWAY', details, false);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable', details?: any) {
    super(503, message, 'SERVICE_UNAVAILABLE', details, false);
  }
}

// Domain-Specific Errors
export class ExternalServiceError extends AppError {
  constructor(serviceName: string, details?: any) {
    super(502, `External service error: ${serviceName}`, 'EXTERNAL_SERVICE_ERROR', details);
  }
}

export class ScrapingError extends AppError {
  constructor(company: string, details?: any) {
    super(500, `Failed to scrape ${company}`, 'SCRAPING_ERROR', details);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database error', details?: any) {
    super(500, message, 'DATABASE_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details?: any) {
    super(401, message, 'AUTHENTICATION_ERROR', details);
  }
}

export class ConfigurationError extends AppError {
  constructor(message = 'Configuration error', details?: any) {
    super(500, message, 'CONFIGURATION_ERROR', details, false);
  }
}

/**
 * Error handler middleware for Express
 */
export const errorHandler = (
  err: Error,
  req: any,
  res: any,
  next: any
) => {
  // Log the error
  if (err instanceof AppError) {
    req.logger?.error(err.message, err, { path: req.path, method: req.method });
  } else {
    req.logger?.error('Unexpected error', err, { path: req.path, method: req.method });
  }

  // Handle operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle unexpected errors
  const internalError = new InternalServerError(
    process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  );
  return res.status(500).json(internalError.toJSON());
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: unknown, res: unknown, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Convert unknown errors to AppError
 */
export const toAppError = (error: any): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  const err = error as Error;

  if (err instanceof SyntaxError && 'body' in err) {
    return new BadRequestError('Invalid JSON format');
  }

  if (err.name === 'ValidationError') {
    return new ValidationError(err.message, (err as { details?: any }).details);
  }

  if (err.name === 'UnauthorizedError') {
    return new UnauthorizedError(err.message);
  }

  if (err.name === 'TokenExpiredError') {
    return new UnauthorizedError('Token expired');
  }

  // Default to internal server error
  return new InternalServerError(
    process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    { originalError: err.name }
  );
};
