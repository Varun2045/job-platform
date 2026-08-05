import request from 'supertest';
import express from 'express';
import { sanitizeRequestBody, sanitizeUserContent, sanitizeStrict } from '../middleware/sanitize.js';

describe('Sanitizer Middleware Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(sanitizeRequestBody);
  });

  describe('Script Tag Sanitization', () => {
    test('should strip dangerous <script> tags from request body', async () => {
      app.post('/api/jobs', (req, res) => {
        res.status(200).json({ body: req.body });
      });

      const payload = {
        title: 'Software Engineer',
        description: 'Great role <script>alert("xss")</script>',
      };

      const res = await request(app).post('/api/jobs').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.body.description).toBe('Great role');
      expect(res.body.body.description).not.toContain('<script>');
      expect(res.body.body.description).not.toContain('alert');
    });

    test('should strip multiple script tags', async () => {
      app.post('/api/jobs', (req, res) => {
        res.status(200).json({ body: req.body });
      });

      const payload = {
        notes: '<script>alert("first")</script> Some text <script>alert("second")</script>',
      };

      const res = await request(app).post('/api/jobs').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.body.notes).not.toContain('<script>');
      expect(res.body.body.notes).not.toContain('alert');
    });
  });

  describe('Event Handler Sanitization', () => {
    test('should strip inline JavaScript event handlers', async () => {
      app.post('/api/jobs', (req, res) => {
        res.status(200).json({ body: req.body });
      });

      const payload = {
        notes: '<img src="invalid.jpg" onerror="alert(1)" /> Click here',
      };

      const res = await request(app).post('/api/jobs').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.body.notes).not.toContain('onerror=');
      expect(res.body.body.notes).not.toContain('alert(1)');
    });

    test('should strip onclick and other event handlers', async () => {
      app.post('/api/jobs', (req, res) => {
        res.status(200).json({ body: req.body });
      });

      const payload = {
        content: '<button onclick="malicious()">Click me</button>',
      };

      const res = await request(app).post('/api/jobs').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.body.content).not.toContain('onclick=');
    });
  });

  describe('JavaScript URI Sanitization', () => {
    test('should strip javascript: URIs', async () => {
      app.post('/api/jobs', (req, res) => {
        res.status(200).json({ body: req.body });
      });

      const payload = {
        link: '<a href="javascript:alert(1)">Click here</a>',
      };

      const res = await request(app).post('/api/jobs').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.body.link).not.toContain('javascript:');
    });
  });

  describe('Nested Object Sanitization', () => {
    test('should sanitize nested objects recursively', async () => {
      app.post('/api/jobs', (req, res) => {
        res.status(200).json({ body: req.body });
      });

      const payload = {
        job: {
          title: 'Software Engineer',
          description: {
            short: 'Great role <script>alert("xss")</script>',
            long: 'Detailed description with <img onerror="alert(1)">',
          },
        },
      };

      const res = await request(app).post('/api/jobs').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.body.job.description.short).not.toContain('<script>');
      expect(res.body.body.job.description.long).not.toContain('onerror=');
    });

    test('should sanitize arrays of objects', async () => {
      app.post('/api/jobs', (req, res) => {
        res.status(200).json({ body: req.body });
      });

      const payload = {
        jobs: [
          { title: 'Job 1', notes: '<script>alert(1)</script>' },
          { title: 'Job 2', notes: '<img onerror="alert(2)">' },
        ],
      };

      const res = await request(app).post('/api/jobs').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.body.jobs[0].notes).not.toContain('<script>');
      expect(res.body.body.jobs[1].notes).not.toContain('onerror=');
    });
  });

  describe('Query Parameter Sanitization', () => {
    test('should sanitize query parameters', async () => {
      app.get('/api/jobs', (req, res) => {
        res.status(200).json({ query: req.query });
      });

      const res = await request(app)
        .get('/api/jobs?search=<script>alert(1)</script>&filter=test');

      expect(res.status).toBe(200);
      expect(res.body.query.search).not.toContain('<script>');
    });
  });

  describe('User Content Sanitization', () => {
    test('should allow more HTML tags for user content', () => {
      const content = '<p>Rich text with <strong>bold</strong> and <em>italic</em></p>';
      const sanitized = sanitizeUserContent(content);
      
      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('<em>');
    });

    test('should still sanitize dangerous content in user content', () => {
      const content = '<p>Safe content <script>alert("xss")</script></p>';
      const sanitized = sanitizeUserContent(content);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>');
    });
  });

  describe('Strict Sanitization', () => {
    test('should remove all HTML in strict mode', () => {
      const content = '<p>Content with <strong>HTML</strong> tags</p>';
      const sanitized = sanitizeStrict(content);
      
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).toContain('Content with HTML tags');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty strings', async () => {
      app.post('/api/jobs', (req, res) => {
        res.status(200).json({ body: req.body });
      });

      const payload = {
        title: '',
        description: '<script>alert("xss")</script>',
      };

      const res = await request(app).post('/api/jobs').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.body.title).toBe('');
    });

    test('should handle null and undefined values', async () => {
      app.post('/api/jobs', (req, res) => {
        res.status(200).json({ body: req.body });
      });

      const payload = {
        title: null,
        description: undefined,
        notes: '<script>alert("xss")</script>',
      };

      const res = await request(app).post('/api/jobs').send(payload);
      expect(res.status).toBe(200);
      expect(res.body.body.title).toBeNull();
      expect(res.body.body.description).toBeUndefined();
    });
  });
});
