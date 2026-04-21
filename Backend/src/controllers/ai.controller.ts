import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthRequest } from '../types/auth.types';
import * as aiService from '../services/ai.service';
import { AiTutorFeedback } from '../models/AiTutorFeedback.model';
import { ok, fail } from '../utils/response';

export async function tutorChat(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { message, session_id, stream, image_data_url } = req.body as {
    message: string;
    session_id?: string;
    stream?: boolean;
    image_data_url?: string;
  };
  const sessionId = session_id || 'default';
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const send = (data: string) => res.write(`data: ${JSON.stringify({ text: data })}\n\n`);
    try {
      const chatId = await aiService.streamTutorChat(req.authUser.id, sessionId, message, image_data_url, (chunk) =>
        send(chunk)
      );
      res.write(`event: done\ndata: ${JSON.stringify({ chatId })}\n\n`);
    } catch (e) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: String(e) })}\n\n`);
    }
    return res.end();
  }
  try {
    const out = await aiService.tutorChat(req.authUser.id, sessionId, message, image_data_url);
    return ok(res, out);
  } catch (e) {
    return fail(res, 500, e instanceof Error ? e.message : 'AI error');
  }
}

export async function tutorHistory(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const items = await aiService.getHistory(req.authUser.id);
  return ok(res, items);
}

export async function clearTutorHistory(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  await aiService.clearHistory(req.authUser.id);
  return ok(res, null, 'Cleared');
}

export async function tutorFeedback(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const { chat_id, rating, feedback } = req.body;
  const doc = await AiTutorFeedback.create({
    user_id: new Types.ObjectId(req.authUser.id),
    chat_id: new Types.ObjectId(chat_id),
    rating,
    feedback,
  });
  return ok(res, doc, 'Thanks');
}

export async function tutorStats(req: AuthRequest, res: Response) {
  if (!req.authUser) return fail(res, 401, 'Unauthorized');
  const stats = await aiService.aiStats(req.authUser.id);
  return ok(res, stats);
}
