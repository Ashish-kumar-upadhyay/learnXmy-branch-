import dotenv from 'dotenv';

dotenv.config();

const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: num(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_MONGODB_URI ?? process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/learnx',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-in-prod-32chars',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-in-prod-32',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  sessionSecret: process.env.SESSION_SECRET ?? 'dev-session-secret-change-me',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:8080',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? '',
  },
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  maxFileMb: num(process.env.MAX_FILE_MB, 5),
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    port: num(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'noreply@learnx.local',
  },
  /** Resend API (server-side only). Welcome + contact form emails. */
  resendApiKey: process.env.RESEND_API_KEY?.trim() ?? '',
  /** Must be a verified sender in Resend (e.g. LearnX <onboarding@resend.dev> for testing). */
  resendFrom: process.env.RESEND_FROM?.trim() || 'LearnX <onboarding@resend.dev>',
  /** Inbox that receives Contact page submissions (defaults to SMTP_FROM if set). */
  contactNotifyEmail: process.env.CONTACT_NOTIFY_EMAIL?.trim() || process.env.SMTP_FROM?.trim() || '',
};
