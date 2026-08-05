# API Response Standardization Guide

## Overview
This document outlines the standardized API response format that should be used across all endpoints in the Job Platform API.

## Standard Response Format

### Success Response
```typescript
{
  "success": true,
  "data": { /* actual data */ },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "optional-request-id",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Error Response
```typescript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional additional error details */ }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Implementation

### Usage in Route Handlers

```typescript
import { 
  sendSuccess, 
  sendError, 
  ErrorCodes,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  conflictResponse
} from '../utils/apiResponse.js';

// Success response
app.get('/api/resource', async (req, res) => {
  const data = await getResource();
  sendSuccess(res, data, 200);
});

// Error response
app.get('/api/resource/:id', async (req, res) => {
  const resource = await getResource(req.params.id);
  if (!resource) {
    return notFoundResponse('Resource');
  }
  sendSuccess(res, resource);
});

// Validation error
app.post('/api/resource', async (req, res) => {
  const errors = validateRequest(req.body);
  if (errors) {
    return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 422, { errors });
  }
  // ... process request
});
```

## Error Codes

### Authentication & Authorization
- `UNAUTHORIZED` - User not authenticated
- `FORBIDDEN` - User lacks permission
- `TOKEN_EXPIRED` - JWT token expired
- `INVALID_CREDENTIALS` - Invalid login credentials

### Validation
- `VALIDATION_ERROR` - Request validation failed
- `INVALID_INPUT` - Invalid input format
- `MISSING_REQUIRED_FIELD` - Required field missing

### Resource Not Found
- `NOT_FOUND` - Resource not found
- `RESOURCE_NOT_FOUND` - Specific resource not found

### Business Logic
- `ALREADY_EXISTS` - Resource already exists
- `CONFLICT` - Resource conflict
- `OPERATION_NOT_ALLOWED` - Operation not permitted

### Server Errors
- `INTERNAL_ERROR` - Internal server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_SERVICE_ERROR` - External API failure

### Rate Limiting
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded

### CSRF
- `CSRF_TOKEN_INVALID` - Invalid CSRF token
- `CSRF_TOKEN_MISSING` - CSRF token missing

## Migration Status

### Completed
- ✅ Created `src/utils/apiResponse.ts` with response utilities
- ✅ Added standardized response helpers
- ✅ Defined error codes
- ✅ Updated authentication endpoints to use standard format
- ✅ Updated error handling in auth middleware

### In Progress
- 🔄 Updating remaining endpoints in server.ts (100+ endpoints)

### Pending
- ⏳ Update apiV1Routes.ts
- ⏳ Update any additional route modules
- ⏳ Update API documentation
- ⏳ Update frontend to handle new response format

## Migration Priority

### High Priority (Authentication & User Management)
- [x] POST /api/auth/register
- [x] POST /api/auth/login
- [ ] GET /api/auth/oauth/:provider
- [ ] GET /api/auth/oauth/google/callback
- [ ] GET /api/auth/oauth/github/callback
- [ ] GET /api/profile
- [ ] POST /api/profile

### Medium Priority (Core Business Logic)
- [ ] GET /api/jobs
- [ ] GET /api/jobs/:hash
- [ ] POST /api/applications
- [ ] GET /api/companies
- [ ] POST /api/companies

### Low Priority (Advanced Features)
- [ ] Copilot endpoints
- [ ] Flashcard endpoints
- [ ] Profile builder endpoints
- [ ] Admin endpoints

## Testing Strategy

### Unit Tests
Each updated endpoint should have tests that verify:
1. Success response format
2. Error response format
3. Correct HTTP status codes
4. Error codes match expected values

### Integration Tests
Test that the frontend can handle:
1. Success responses with data
2. Error responses with error objects
3. Pagination metadata
4. Timestamps

## Breaking Changes

### Frontend Impact
The frontend needs to be updated to handle the new response format:

**Old format:**
```javascript
const response = await fetch('/api/resource');
const data = await response.json();
// data is the actual resource
```

**New format:**
```javascript
const response = await fetch('/api/resource');
const result = await response.json();
if (result.success) {
  const data = result.data;
  // use data
} else {
  const error = result.error;
  // handle error
}
```

### Migration Timeline
1. Phase 1: Update backend endpoints (in progress)
2. Phase 2: Update frontend to handle both formats
3. Phase 3: Remove old format support from backend
4. Phase 4: Clean up frontend code

## Rollback Plan

If issues arise during migration:
1. Revert endpoint changes using git
2. Keep both response formats temporarily
3. Add feature flag to switch between formats
4. Gradually migrate frontend
5. Remove old format once migration is complete

## Notes

- The standardized response format is already implemented in the utility module
- Some endpoints have been updated as examples
- The remaining endpoints should follow the same pattern
- Consider using a middleware to automatically wrap responses
- Update OpenAPI/Swagger documentation to reflect new format
