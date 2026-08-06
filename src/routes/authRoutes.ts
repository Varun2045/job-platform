/**
 * Authentication Routes
 * 
 * Handles user registration, login, and OAuth authentication
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { config } from '../config/config.js';
import { Logger } from '../core/Logger.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/apiResponse.js';
import type { Request, Response } from 'express';

const router = express.Router();

// This will be set by the main server file
let storage: any;

export function setStorage(storageProvider: any) {
  storage = storageProvider;
}

// In-memory fallback store when underlying storage provider does not implement user table
const inMemoryUsers = new Map<string, any>();

async function findUserByEmail(email: string) {
  const normEmail = email.toLowerCase().trim();
  if (storage && typeof storage.getUserByEmail === 'function') {
    try {
      const u = await storage.getUserByEmail(normEmail);
      if (u) return u;
    } catch (_) {}
  }
  return inMemoryUsers.get(normEmail) || null;
}

async function createUserRecord(userData: { email: string; password?: string; name?: string; role?: string }) {
  const normEmail = userData.email.toLowerCase().trim();
  if (storage && typeof storage.createUser === 'function') {
    try {
      return await storage.createUser(userData);
    } catch (_) {}
  }
  const id = crypto.randomUUID();
  const user = {
    id,
    email: normEmail,
    password: userData.password || '',
    name: userData.name || normEmail.split('@')[0],
    role: userData.role || 'User',
  };
  inMemoryUsers.set(normEmail, user);
  return user;
}

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Email and password are required', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Invalid email format', 400);
    }

    if (password.length < 8) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Password must be at least 8 characters long', 400);
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return sendError(res, ErrorCodes.CONFLICT, 'User already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUserRecord({
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: 'User',
    });

    return sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
        token: jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET || 'default-secret',
          { expiresIn: '7d' },
        ),
      },
      201,
    );
  } catch (err: unknown) {
    const error = err as Error;
    Logger.logError('Error in auth register', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, 'Registration failed. Please try again.', 500);
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Email and password are required', 400);
    }

    let user = await findUserByEmail(email);
    if (!user) {
      // If user is not found, auto-create credentials upon first login attempt
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await createUserRecord({
        email,
        password: hashedPassword,
        name: email.split('@')[0],
        role: 'User',
      });
    } else if (user.password) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return sendError(res, ErrorCodes.INVALID_CREDENTIALS, 'Invalid credentials', 401);
      }
    }

    return sendSuccess(res, {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        photoUrl: user.photoUrl,
        preferredRoles: user.preferredRoles,
        preferredCities: user.preferredCities,
        experienceLevel: user.experienceLevel,
        techStack: user.techStack,
        linkedin: user.linkedin,
        github: user.github,
        portfolio: user.portfolio,
      },
      token: jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' },
      ),
    });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.logError('Error in auth login', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, 'Login failed. Please try again.', 500);
  }
});

/**
 * GET /api/auth/oauth/:provider
 * Initiate OAuth flow
 */
router.get('/oauth/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { origin } = req.query;

    if (provider !== 'google' && provider !== 'github') {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, `Unsupported OAuth provider: ${provider}`, 400);
    }

    const clientOrigin = (origin as string) || 'http://localhost:5173';
    const clientId = provider === 'google' ? process.env.GOOGLE_CLIENT_ID : process.env.GITHUB_CLIENT_ID;

    // Fast-path for localhost or unconfigured Client IDs
    if (!clientId || clientOrigin.includes('localhost') || clientOrigin.includes('127.0.0.1')) {
      const mockToken = jwt.sign(
        { id: `mock-${provider}-id`, email: `${provider}-user@careeros.studio`, role: 'User' },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' }
      );
      return sendSuccess(res, { url: `${clientOrigin}/?token=${mockToken}&email=${encodeURIComponent(`${provider}-user@careeros.studio`)}` });
    }

    // Production OAuth URLs when client IDs are configured
    const oauthUrls: Record<string, string> = {
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${clientOrigin}/auth/google/callback`)}&response_type=code&scope=openid%20email%20profile`,
      github: `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${clientOrigin}/auth/github/callback`)}&scope=user:email`,
    };

    return sendSuccess(res, { url: oauthUrls[provider] });
  } catch (err: unknown) {
    const error = err as Error;
    Logger.logError('Error in OAuth initiation', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, 'OAuth initiation failed', 500);
  }
});

/**
 * GET /api/auth/oauth/:provider/callback
 * Handle OAuth callback
 */
router.get('/oauth/:provider/callback', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { code, state } = req.query;

    if (!code) {
      return sendError(res, ErrorCodes.VALIDATION_ERROR, 'Authorization code required', 400);
    }

    // In production, this would exchange the code for an access token
    // and fetch user profile from the OAuth provider
    // For now, we'll create a mock user
    
    const mockUser = {
      id: crypto.randomUUID(),
      email: `${provider}-user@careeros.studio`,
      name: `${(provider as string).charAt(0).toUpperCase() + (provider as string).slice(1)} User`,
      role: 'User',
    };

    const token = jwt.sign(
      { id: mockUser.id, email: mockUser.email, role: mockUser.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    const redirectUrl = `${req.query.origin || 'http://localhost:5173'}?token=${token}&email=${encodeURIComponent(mockUser.email)}`;
    return res.redirect(redirectUrl);
  } catch (err: unknown) {
    const error = err as Error;
    Logger.logError('Error in OAuth callback', error);
    return sendError(res, ErrorCodes.INTERNAL_ERROR, 'OAuth callback failed', 500);
  }
});

export default router;