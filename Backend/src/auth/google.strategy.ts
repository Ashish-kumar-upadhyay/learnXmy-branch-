import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../config/environment';
import { User } from '../models/User.model';
import { generateUniqueStudentId } from '../services/studentId.service';
import { hashPassword } from '../utils/hash';

// Sets up Google OAuth strategy for passport.
// Flow notes:
// - We do not rely on existing Supabase user ids.
// - We map Google account to `users` collection using email.
export function setupGoogleStrategy() {
  // Agar env secrets set nahi hain, to strategy register na karein (server crash avoid).
  if (!env.google.clientId || !env.google.clientSecret || !env.google.callbackUrl) {
    // eslint-disable-next-line no-console
    console.warn(
      "Google OAuth skipped: missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_CALLBACK_URL in env."
    );
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
      },
      async (_accessToken: any, _refreshToken: any, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || email?.split('@')[0] || 'Google User';
          if (!email) return done(new Error('Google account has no email'), undefined);

          const existing = await User.findOne({ email: email.toLowerCase() });
          if (existing) {
            return done(null, { email, name, userId: String(existing._id) });
          }

          // Create a user row for first-time Google login.
          // Password is not used for Google login, but schema requires it.
          const randomPassword = Math.random().toString(36).slice(2);
          const password = await hashPassword(randomPassword);
          const studentId = await generateUniqueStudentId();
          const user = await User.create({
            email: email.toLowerCase(),
            password,
            name,
            role: 'student',
            assignedClass: null,
            studentId,
          });

          return done(null, { email, name, userId: String(user._id) });
        } catch (e) {
          return done(e as Error, undefined);
        }
      }
    )
  );
}

