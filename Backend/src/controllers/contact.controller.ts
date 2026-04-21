import { Request, Response } from 'express';
import { sendContactFormViaResend } from '../services/mail.service';
import { ok, fail } from '../utils/response';

export async function submitContact(req: Request, res: Response) {
  const { name, email, message } = req.body as {
    name?: string;
    email?: string;
    message?: string;
  };
  const result = await sendContactFormViaResend({
    fromName: String(name || '').trim(),
    fromEmail: String(email || '').trim(),
    message: String(message || '').trim(),
  });
  if (!result.ok) {
    return fail(res, 503, result.error || 'Could not send message');
  }
  return ok(res, { sent: true }, 'Message sent');
}
