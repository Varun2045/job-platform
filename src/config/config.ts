import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env variables
dotenv.config();

export interface Weights {
  skills: number;
  title: number;
  experience: number;
  location: number;
  tfidf: number;
}

export interface FeatureFlags {
  resumeMatching: boolean;
  dashboard: boolean;
  screenshots: boolean;
  playwright: boolean;
  email: boolean;
  explainableAi: boolean;
  advancedTags: boolean;
  multiDepartment: boolean;
  ruleEngine: boolean;
  weightedKeywords: boolean;
}

export interface Config {
  supabaseUrl: string;
  supabaseServiceKey: string;
  resendApiKey: string;
  senderEmail: string;
  recipientEmail: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  matchThreshold: number;
  weights: Weights;
  features: FeatureFlags;
  isLocal: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri?: string;
  localAdminEmail?: string;
  localAdminPassword?: string;
  localUserEmail?: string;
  localUserPassword?: string;
  localViewerEmail?: string;
  localViewerPassword?: string;
}

// Startup Validation Helper
function validateEnv(key: string, required: boolean = true): string {
  const val = process.env[key];
  if (required && (!val || val.trim() === '')) {
    throw new Error(`CRITICAL STARTUP ERROR: Environment variable "${key}" is required but missing or empty.`);
  }
  return val || '';
}

// Load Weights
const defaultWeights: Weights = {
  skills: 40,
  title: 30,
  experience: 15,
  location: 10,
  tfidf: 5,
};

let loadedWeights = defaultWeights;
try {
  const rootWeightsPath = path.join(process.cwd(), 'config', 'weights.json');
  const targetPath = fs.existsSync(rootWeightsPath) ? rootWeightsPath : '';

  if (targetPath) {
    const raw = fs.readFileSync(targetPath, 'utf-8');
    const parsed = JSON.parse(raw);
    loadedWeights = {
      skills: Number(process.env.WEIGHT_SKILLS ?? parsed.skills ?? defaultWeights.skills),
      title: Number(process.env.WEIGHT_TITLE ?? parsed.title ?? defaultWeights.title),
      experience: Number(process.env.WEIGHT_EXPERIENCE ?? parsed.experience ?? defaultWeights.experience),
      location: Number(process.env.WEIGHT_LOCATION ?? parsed.location ?? defaultWeights.location),
      tfidf: Number(process.env.WEIGHT_TFIDF ?? parsed.tfidf ?? defaultWeights.tfidf),
    };
  }
} catch {
  // Ignore and use default / env
  loadedWeights = {
    skills: Number(process.env.WEIGHT_SKILLS ?? defaultWeights.skills),
    title: Number(process.env.WEIGHT_TITLE ?? defaultWeights.title),
    experience: Number(process.env.WEIGHT_EXPERIENCE ?? defaultWeights.experience),
    location: Number(process.env.WEIGHT_LOCATION ?? defaultWeights.location),
    tfidf: Number(process.env.WEIGHT_TFIDF ?? defaultWeights.tfidf),
  };
}

// Normalize weights to sum to 1
const sum =
  loadedWeights.skills + loadedWeights.title + loadedWeights.experience + loadedWeights.location + loadedWeights.tfidf;
if (sum !== 100) {
  loadedWeights.skills = Math.round((loadedWeights.skills / sum) * 100);
  loadedWeights.title = Math.round((loadedWeights.title / sum) * 100);
  loadedWeights.experience = Math.round((loadedWeights.experience / sum) * 100);
  loadedWeights.location = Math.round((loadedWeights.location / sum) * 100);
  loadedWeights.tfidf =
    100 - (loadedWeights.skills + loadedWeights.title + loadedWeights.experience + loadedWeights.location);
}

// Determine if we are running in local/offline mode
const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
const hasResend = !!process.env.RESEND_API_KEY;

// Check production prerequisites
const isGitHubActions = !!process.env.GITHUB_ACTIONS;
const isProduction = isGitHubActions || process.env.NODE_ENV === 'production';
const isFileStorageMode = process.env.STORAGE_MODE === 'file' || !hasSupabase;

// In production, require Supabase keys if STORAGE_MODE is explicitly set to supabase
if (isProduction && process.env.STORAGE_MODE === 'supabase' && process.env.IS_LOCAL !== 'true') {
  validateEnv('SUPABASE_URL', true);
  validateEnv('SUPABASE_SERVICE_KEY', true);
  if (process.env.RESEND_API_KEY) {
    if (!process.env.NOTIFICATION_EMAIL_SENDER && !process.env.EMAIL_FROM) {
      validateEnv('NOTIFICATION_EMAIL_SENDER', true);
    }
    validateEnv('NOTIFICATION_EMAIL_RECIPIENT', true);
  }
}

export const config: Config = {
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? '',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  senderEmail: process.env.NOTIFICATION_EMAIL_SENDER || process.env.EMAIL_FROM || 'alerts@yourdomain.com',
  recipientEmail: process.env.NOTIFICATION_EMAIL_RECIPIENT ?? '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramChatId: process.env.TELEGRAM_CHAT_ID,
  matchThreshold: Number(process.env.MATCH_THRESHOLD ?? 0),
  weights: loadedWeights,
  features: {
    resumeMatching: process.env.FEATURE_RESUME_MATCHING !== 'false',
    dashboard: process.env.FEATURE_DASHBOARD !== 'false',
    screenshots: process.env.FEATURE_SCREENSHOTS !== 'false',
    playwright: process.env.FEATURE_PLAYWRIGHT !== 'false',
    email: process.env.FEATURE_EMAIL !== 'false' && hasResend,
    explainableAi: process.env.FEATURE_EXPLAINABLE_AI !== 'false',
    advancedTags: process.env.FEATURE_ADVANCED_TAGS !== 'false',
    multiDepartment: process.env.FEATURE_MULTI_DEPARTMENT !== 'false',
    ruleEngine: process.env.FEATURE_RULE_ENGINE !== 'false',
    weightedKeywords: process.env.FEATURE_WEIGHTED_KEYWORDS !== 'false',
  },
  isLocal: isFileStorageMode,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
  localAdminEmail: process.env.LOCAL_ADMIN_EMAIL,
  localAdminPassword: process.env.LOCAL_ADMIN_PASSWORD,
  localUserEmail: process.env.LOCAL_USER_EMAIL,
  localUserPassword: process.env.LOCAL_USER_PASSWORD,
  localViewerEmail: process.env.LOCAL_VIEWER_EMAIL,
  localViewerPassword: process.env.LOCAL_VIEWER_PASSWORD,
};
