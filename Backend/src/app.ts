import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from 'passport';
import { env } from './config/environment';
import { errorMiddleware } from './middleware/error.middleware';
import { ensureUploadRoot } from './services/file.service';
import { requireDatabaseReady } from './middleware/db-ready.middleware';

import authRoutes from './routes/auth.routes';
import googleRoutes from './routes/google.routes';
import userRoutes from './routes/user.routes';
import classRoutes from './routes/class.routes';
import assignmentRoutes from './routes/assignment.routes';
import examRoutes from './routes/exam.routes';
import attendanceRoutes from './routes/attendance.routes';
import teacherAttendanceRoutes from './routes/teacher-attendance.routes';
import feeRoutes from './routes/fee.routes';
import salaryRoutes from './routes/salary.routes';
import notificationRoutes from './routes/notification.routes';
import announcementRoutes from './routes/announcement.routes';
import leaveRoutes from './routes/leave.routes';
import aiRoutes from './routes/ai.routes';
import fileRoutes from './routes/file.routes';
import timetableRoutes from './routes/timetable.routes';
import lectureRoutes from './routes/lecture.routes';
import sprintPlanRoutes from './routes/sprint-plan.routes';
import supportTicketsRoutes from './routes/support-tickets.routes';
import analyticsRoutes from './routes/analytics.routes';
import contactRoutes from './routes/contact.routes';
import aiGradingRoutes from './routes/aiGrading.routes';
import plagiarismRoutes from './routes/plagiarism.routes';
import { setupGoogleStrategy } from './auth/google.strategy';

void ensureUploadRoot();
setupGoogleStrategy();

const app = express();
const configuredOrigins = env.corsOrigin
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean);

const corsOrigin: cors.CorsOptions['origin'] = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (env.corsOrigin === '*') return callback(null, true);
  if (configuredOrigins.includes(origin)) return callback(null, true);

  // Allow local frontend on any localhost/127.0.0.1 port (Vite can switch ports).
  try {
    const parsed = new URL(origin);
    if (
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
      Number.isFinite(Number(parsed.port || '80'))
    ) {
      return callback(null, true);
    }
  } catch {
    // Invalid Origin header; reject below.
  }
  return callback(new Error(`CORS blocked for origin: ${origin}`));
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.nodeEnv === 'production' ? 1000 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  helmet({
    // Frontend (8080) loads avatar/selfie images from backend (5000).
    // Default CORP `same-origin` blocks such resources in browser.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: env.nodeEnv === 'production', 
      sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
      httpOnly: true
    },
  }) as any
);
app.use(passport.initialize());
app.use(express.json({ limit: '12mb' }));
app.use(limiter);

app.get('/', (_req, res) => res.send('API is running!'));
app.get('/health', (_req, res) => res.json({ ok: true }));
/** Contact form works without DB (Resend only). */
app.use('/api/contact', contactRoutes);
app.use('/api', requireDatabaseReady);

app.use('/api/auth', authRoutes);
app.use('/api/auth/google', googleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/teacher-attendance', teacherAttendanceRoutes);
app.use('/api/fee', feeRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/leave-requests', leaveRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api', sprintPlanRoutes);
app.use('/api/support-tickets', supportTicketsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai-grading', aiGradingRoutes);
app.use('/api/plagiarism', plagiarismRoutes);

app.use(errorMiddleware);

export default app;
