import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  
  // Database & Storage
  STORAGE_MODE: z.enum(["file", "supabase"]).default("file"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().url().optional(),
  
  // Security & Authentication
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters long for cryptographic security"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters long"),
  
  // AI & LLM Providers
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  
  // Email & Notifications
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  NOTIFICATION_EMAIL_SENDER: z.string().email().optional(),
  NOTIFICATION_EMAIL_RECIPIENT: z.string().email().optional(),
  
  // Telegram Bot
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  // Encryption Key for sensitive data at rest
  ENCRYPTION_KEY: z.string().min(32, "ENCRYPTION_KEY must be at least 32 characters long"),
  
  // Playwright Configuration
  PLAYWRIGHT_TIMEOUT: z.coerce.number().default(30000),
  PLAYWRIGHT_CONCURRENCY: z.coerce.number().default(2),
  PLAYWRIGHT_HEADLESS: z.coerce.boolean().default(true),
  
  // Feature Flags
  FEATURE_RESUME_MATCHING: z.coerce.boolean().default(true),
  FEATURE_DASHBOARD: z.coerce.boolean().default(true),
  FEATURE_SCREENSHOTS: z.coerce.boolean().default(true),
  FEATURE_PLAYWRIGHT: z.coerce.boolean().default(true),
  FEATURE_EMAIL: z.coerce.boolean().default(true),
  FEATURE_EXPLAINABLE_AI: z.coerce.boolean().default(true),
  FEATURE_ADVANCED_TAGS: z.coerce.boolean().default(true),
  FEATURE_MULTI_DEPARTMENT: z.coerce.boolean().default(true),
  FEATURE_RULE_ENGINE: z.coerce.boolean().default(true),
  FEATURE_WEIGHTED_KEYWORDS: z.coerce.boolean().default(true),
  
  // OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  
  // Local Development Users
  LOCAL_ADMIN_EMAIL: z.string().email().optional(),
  LOCAL_ADMIN_PASSWORD: z.string().min(8).optional(),
  LOCAL_USER_EMAIL: z.string().email().optional(),
  LOCAL_USER_PASSWORD: z.string().min(8).optional(),
  LOCAL_VIEWER_EMAIL: z.string().email().optional(),
  LOCAL_VIEWER_PASSWORD: z.string().min(8).optional(),
  
  // Matching Configuration
  MATCH_THRESHOLD: z.coerce.number().default(0),
  WEIGHT_SKILLS: z.coerce.number().optional(),
  WEIGHT_TITLE: z.coerce.number().optional(),
  WEIGHT_EXPERIENCE: z.coerce.number().optional(),
  WEIGHT_LOCATION: z.coerce.number().optional(),
  WEIGHT_TFIDF: z.coerce.number().optional(),
});

// Validate environment variables at startup
export const env = envSchema.parse(process.env);

// Derived configurations
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

export const isFileStorageMode = env.STORAGE_MODE === "file" || !env.SUPABASE_URL;
export const hasSupabase = !!env.SUPABASE_URL && !!env.SUPABASE_SERVICE_ROLE_KEY;
export const hasResend = !!env.RESEND_API_KEY;

// CORS configuration
export const corsOrigins = isDevelopment
  ? [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
    ]
  : [
      "https://careeros.studio",
      "https://www.careeros.studio",
    ];

// Rate limiting configuration
export const rateLimitConfig = {
  windowMs: isDevelopment ? 60 * 1000 : 15 * 60 * 1000, // 1 min dev, 15 min prod
  max: isDevelopment ? 200 : 100, // More lenient in development
};

// Auth rate limiting (stricter)
export const authRateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
};
