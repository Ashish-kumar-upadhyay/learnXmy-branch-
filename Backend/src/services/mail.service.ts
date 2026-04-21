import { Resend } from 'resend';
import { env } from '../config/environment';
import { AppRole } from '../types/auth.types';
import { sendHtmlMail } from './email.service';
import { logger } from '../utils/logger';

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (!env.resendApiKey) return null;
  if (!resend) resend = new Resend(env.resendApiKey);
  return resend;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function publicOrigin(): string {
  return env.frontendUrl.replace(/\/$/, '');
}

function loginCodeBlock(role: AppRole, studentId?: string | null, teacherCode?: string | null): string {
  if (role === 'student' && studentId) {
    return `<p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Your login code (Student ID)</p>
      <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.04em;color:#0f172a;font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(studentId)}</p>
      <p style="margin:12px 0 0;font-size:14px;color:#475569;">Sign in at LearnX with this ID and the password you were given.</p>`;
  }
  if (role === 'teacher' && teacherCode) {
    return `<p style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Your login code (Teacher code)</p>
      <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.04em;color:#0f172a;font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(teacherCode)}</p>
      <p style="margin:12px 0 0;font-size:14px;color:#475569;">Use this code with your password on the login page.</p>`;
  }
  return `<p style="margin:0;font-size:15px;color:#475569;">Sign in with your <strong>email address</strong> and the password you were given.</p>`;
}

function welcomeEmailHtml(params: {
  name: string;
  role: AppRole;
  roleLabel: string;
  studentId?: string | null;
  teacherCode?: string | null;
  magicLink: string;
  loginPageUrl: string;
}): string {
  const codeSection = loginCodeBlock(params.role, params.studentId, params.teacherCode);
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.08);">
        <tr><td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#2563eb 100%);padding:28px 24px;text-align:center;">
          <p style="margin:0;font-size:12px;font-weight:600;letter-spacing:0.12em;color:rgba(255,255,255,0.85);">LEARNX</p>
          <h1 style="margin:8px 0 0;font-size:24px;font-weight:800;color:#ffffff;">Welcome, ${escapeHtml(params.name)}!</h1>
          <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.92);">Your ${escapeHtml(params.roleLabel)} account is ready.</p>
        </td></tr>
        <tr><td style="padding:28px 24px;">
          <div style="background:#f8fafc;border-radius:12px;padding:20px;border:1px solid #e2e8f0;">
            ${codeSection}
          </div>
          <p style="margin:24px 0 16px;font-size:15px;line-height:1.6;color:#334155;">Use the secure button below to open LearnX and sign in instantly (one-time magic link).</p>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto 12px;">
            <tr><td style="border-radius:10px;background:linear-gradient(135deg,#4f46e5,#7c3aed);">
              <a href="${escapeHtml(params.magicLink)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Open LearnX — magic sign-in</a>
            </td></tr>
          </table>
          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
            <tr><td style="border-radius:10px;border:2px solid #c7d2fe;">
              <a href="${escapeHtml(params.loginPageUrl)}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#4338ca;text-decoration:none;">Go to login page</a>
            </td></tr>
          </table>
          <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">If you did not expect this email, you can ignore it. The magic link expires after 7 days.</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">LearnX — Premium learning platform</p>
    </td></tr>
  </table>
</body></html>`;
}

export function shouldSendWelcomeToAddress(email: string | undefined | null): boolean {
  if (!email || !email.includes('@')) return false;
  if (email.toLowerCase().endsWith('@learnx.local')) return false;
  return true;
}

function buildPlainTextWelcome(params: {
  name: string;
  role: AppRole;
  roleLabel: string;
  studentId?: string | null;
  teacherCode?: string | null;
  magicLink: string;
  loginPageUrl: string;
}): string {
  const lines = [
    `Hi ${params.name},`,
    ``,
    `Your LearnX ${params.roleLabel} account is ready.`,
    ``,
  ];
  if (params.role === 'student' && params.studentId) {
    lines.push(`Student ID (login code): ${params.studentId}`);
    lines.push(`Sign in with this ID and your password on the student login page.`);
  } else if (params.role === 'teacher' && params.teacherCode) {
    lines.push(`Teacher code: ${params.teacherCode}`);
    lines.push(`Use this code with your password on the login page.`);
  } else {
    lines.push(`Sign in with your email address and the password you were given.`);
  }
  lines.push(
    ``,
    `One-time magic sign-in link:`,
    params.magicLink,
    ``,
    `Login page: ${params.loginPageUrl}`,
    ``,
    `— LearnX`
  );
  return lines.join('\n');
}

/**
 * Sends welcome email: tries Resend first, then Gmail/SMTP from .env if Resend fails or is not configured.
 * Resend sandbox (`onboarding@resend.dev`) only delivers to your own verified address — use a verified domain + RESEND_FROM for any recipient.
 */
export async function sendWelcomeEmailViaResend(params: {
  to: string;
  name: string;
  role: AppRole;
  welcomeToken: string;
  studentId?: string | null;
  teacherCode?: string | null;
}): Promise<boolean> {
  if (!shouldSendWelcomeToAddress(params.to)) return false;

  const base = publicOrigin();
  const magicLink = `${base}/auth/welcome?token=${encodeURIComponent(params.welcomeToken)}`;
  const loginPageUrl = `${base}/auth`;

  const roleLabel =
    params.role === 'student' ? 'Student' : params.role === 'teacher' ? 'Teacher' : 'Admin';

  const subject = `Welcome to LearnX — ${roleLabel}`;
  const html = welcomeEmailHtml({
    name: params.name,
    role: params.role,
    roleLabel,
    studentId: params.studentId,
    teacherCode: params.teacherCode,
    magicLink,
    loginPageUrl,
  });
  const text = buildPlainTextWelcome({
    name: params.name,
    role: params.role,
    roleLabel,
    studentId: params.studentId,
    teacherCode: params.teacherCode,
    magicLink,
    loginPageUrl,
  });

  const to = params.to.trim();
  const client = getResend();

  if (client && env.resendApiKey) {
    const { error } = await client.emails.send({
      from: env.resendFrom,
      to: [to],
      subject,
      html,
      text,
    });
    if (!error) {
      logger.info('Welcome email sent via Resend', { to });
      return true;
    }
    logger.warn('Resend welcome email failed; trying SMTP fallback', {
      to,
      resendMessage: error.message,
    });
  } else {
    logger.warn('RESEND_API_KEY missing; sending welcome email via SMTP only', { to });
  }

  const smtp = await sendHtmlMail(to, subject, html, text);
  if (smtp.ok) {
    logger.info('Welcome email sent via SMTP', { to });
    return true;
  }

  logger.error('Welcome email failed (Resend and SMTP)', { to, smtpError: smtp.error });
  return false;
}

export async function sendContactFormViaResend(params: {
  fromName: string;
  fromEmail: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const client = getResend();
  if (!client) {
    return { ok: false, error: 'Email service is not configured (RESEND_API_KEY).' };
  }
  const to = env.contactNotifyEmail?.trim();
  if (!to) {
    return { ok: false, error: 'Contact inbox is not configured (CONTACT_NOTIFY_EMAIL or SMTP_FROM).' };
  }

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;padding:16px;">
    <h2 style="color:#0f172a;">LearnX contact form</h2>
    <p><strong>From:</strong> ${escapeHtml(params.fromName)} &lt;${escapeHtml(params.fromEmail)}&gt;</p>
    <p style="white-space:pre-wrap;color:#334155;">${escapeHtml(params.message)}</p>
  </body></html>`;

  const { error } = await client.emails.send({
    from: env.resendFrom,
    to: [to],
    replyTo: params.fromEmail.trim(),
    subject: `[LearnX Contact] ${params.fromName}`.slice(0, 200),
    html,
    text: `From: ${params.fromName} <${params.fromEmail}>\n\n${params.message}`,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
