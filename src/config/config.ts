import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
}

export interface Config {
  supabaseUrl: string;
  supabaseServiceKey: string;
  resendApiKey: string;
  senderEmail: string;
  recipientEmail: string;
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
  const weightsPath = path.join(__dirname, 'weights.json');
  // Fallback to searching relative to project root
  const rootWeightsPath = path.join(process.cwd(), 'config', 'weights.json');
  const targetPath = fs.existsSync(weightsPath) ? weightsPath : fs.existsSync(rootWeightsPath) ? rootWeightsPath : '';

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

// In production/GitHub Actions we fail fast if secrets are missing.
// Locally, if they are missing, we fall back to FileStorage and disable email (Offline mode).
if (isProduction) {
  validateEnv('SUPABASE_URL', true);
  validateEnv('SUPABASE_SERVICE_KEY', true);
  if (process.env.RESEND_API_KEY) {
    validateEnv('NOTIFICATION_EMAIL_SENDER', true);
    validateEnv('NOTIFICATION_EMAIL_RECIPIENT', true);
  }
}

export const config: Config = {
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? '',
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  senderEmail: process.env.NOTIFICATION_EMAIL_SENDER ?? 'alerts@yourdomain.com',
  recipientEmail: process.env.NOTIFICATION_EMAIL_RECIPIENT ?? '',
  matchThreshold: Number(process.env.MATCH_THRESHOLD ?? 70),
  weights: loadedWeights,
  features: {
    resumeMatching: process.env.FEATURE_RESUME_MATCHING !== 'false',
    dashboard: process.env.FEATURE_DASHBOARD !== 'false',
    screenshots: process.env.FEATURE_SCREENSHOTS !== 'false',
    playwright: process.env.FEATURE_PLAYWRIGHT !== 'false',
    email: process.env.FEATURE_EMAIL !== 'false' && hasResend,
  },
  isLocal: process.env.IS_LOCAL === 'true' || !hasSupabase,
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
