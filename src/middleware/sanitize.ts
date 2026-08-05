import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  allowedAttributes: {
    a: ['href', 'title', 'target'],
    p: ['class'],
    li: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    a: ['http', 'https', 'mailto', 'tel'],
  },
  selfClosing: ['br', 'hr'],
  // Security-focused options
  disallowedTagsMode: 'discard',
  enforceHtmlBoundary: true,
};

// Skip sanitization for specific routes that need raw HTML
const SKIP_SANITIZATION_ROUTES = [
  '/api/scraper/test-selector',
  '/api/profile-builder/publish-website',
];

/**
 * Deep sanitizes an object by recursively cleaning all string values
 */
function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        // For HTML content, use sanitizeHtml
        if (value.includes('<') && value.includes('>')) {
          sanitized[key] = sanitizeHtml(value, sanitizeOptions).trim();
        } else {
          // For plain text, just remove potential script content
          sanitized[key] = value
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
        }
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

/**
 * Express middleware to sanitize request bodies, query parameters, and route parameters
 */
export const sanitizeRequestBody = (req: Request, res: Response, next: NextFunction) => {
  // Skip sanitization for routes that need raw HTML
  if (SKIP_SANITIZATION_ROUTES.some((route) => req.path.startsWith(route))) {
    // Only sanitize non-HTML fields
    if (req.body && typeof req.body === 'object') {
      const { html, ...otherBody } = req.body;
      req.body = { ...sanitizeObject(otherBody), html };
    }
    return next();
  }

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize route parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Specialized sanitizer for user-generated content that allows more HTML tags
 */
export const sanitizeUserContent = (content: string): string => {
  const userContentOptions: sanitizeHtml.IOptions = {
    ...sanitizeOptions,
    allowedTags: [
      'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'ul', 'ol', 'li',
      'a', 'blockquote', 'code', 'pre',
      'sub', 'sup', 'span', 'div',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      p: ['class', 'style'],
      span: ['class', 'style'],
      div: ['class', 'style'],
      code: ['class'],
      pre: ['class'],
    },
  };
  
  return sanitizeHtml(content, userContentOptions);
};

/**
 * Strict sanitizer for system fields that should contain no HTML
 */
export const sanitizeStrict = (content: string): string => {
  const strictOptions: sanitizeHtml.IOptions = {
    allowedTags: [],
    allowedAttributes: {},
  };
  
  return sanitizeHtml(content, strictOptions).trim();
};
