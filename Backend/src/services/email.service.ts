import nodemailer from 'nodemailer';
import { env } from '../config/environment';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
    });
  }
  return transporter;
}

export async function sendMail(to: string, subject: string, text: string) {
  const t = getTransporter();
  if (!t) {
    logger.warn('SMTP not configured; skipping email', { to, subject });
    return;
  }
  await t.sendMail({ from: env.smtp.from, to, subject, text });
}

/** HTML welcome / transactional mail when Resend is unavailable or rejects (e.g. sandbox limits). */
export async function sendHtmlMail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) {
    return { ok: false, error: 'SMTP not configured' };
  }
  try {
    await t.sendMail({
      from: env.smtp.from,
      to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn('SMTP sendHtmlMail failed', { to, subject, error: msg });
    return { ok: false, error: msg };
  }
}
