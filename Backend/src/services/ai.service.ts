import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/environment';
import { AiChatHistory } from '../models/AiChatHistory.model';
import { Types } from 'mongoose';
import { logger } from '../utils/logger';

const TUTOR_SYSTEM_PROMPT = `You are LearnX AI Tutor for students.

Rules:
1) Explain in simple Hinglish when possible.
2) If the doubt is math/numerical, give:
   - Given
   - Formula/Concept
   - Step-by-step solution
   - Final Answer
3) If image text is unclear, say what is unclear and ask for a clearer image.
4) For handwritten/photo doubts, first interpret the question from image, then solve.
5) Keep answers concise but complete.
6) Never hallucinate values not visible in question/image.`;

const IMAGE_HINT_PROMPT =
  'The student attached an image (possibly handwritten). First read/interpret the question from image, then solve step-by-step. If blur/partial image, clearly mention uncertainty and ask student to re-upload.';

let modelCache: { names: string[]; cachedAt: number } | null = null;

async function resolveModelNames(): Promise<string[]> {
  const now = Date.now();
  if (modelCache && now - modelCache.cachedAt < 10 * 60 * 1000) {
    return modelCache.names;
  }

  const staticFallback = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
  ];

  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${env.geminiApiKey}`);
    if (!resp.ok) throw new Error(`ListModels failed (${resp.status})`);
    const json = (await resp.json()) as any;
    const dyn = (json?.models ?? [])
      .filter((m: any) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map((m: any) => String(m.name ?? '').replace(/^models\//, ''))
      .filter((n: string) => n.startsWith('gemini-'));

    const merged = [...new Set([...dyn, ...staticFallback])];
    modelCache = { names: merged, cachedAt: now };
    return merged;
  } catch (e) {
    logger.warn('Gemini ListModels failed; using static model fallback', { error: String(e) });
    modelCache = { names: staticFallback, cachedAt: now };
    return staticFallback;
  }
}

async function generateWithFallback(contentParts: any[]) {
  const modelNames = await resolveModelNames();
  let lastErr: unknown = null;
  for (const name of modelNames) {
    try {
      const gen = new GoogleGenerativeAI(env.geminiApiKey);
      const model = gen.getGenerativeModel({ model: name });
      const result = await model.generateContent(contentParts);
      return result;
    } catch (e) {
      lastErr = e;
      logger.warn('Gemini model attempt failed', { model: name, error: String(e) });
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('No available Gemini model');
}

async function generateStreamWithFallback(contentParts: any[]) {
  const modelNames = await resolveModelNames();
  let lastErr: unknown = null;
  for (const name of modelNames) {
    try {
      const gen = new GoogleGenerativeAI(env.geminiApiKey);
      const model = gen.getGenerativeModel({ model: name });
      const result = await model.generateContentStream(contentParts);
      return result;
    } catch (e) {
      lastErr = e;
      logger.warn('Gemini stream model attempt failed', { model: name, error: String(e) });
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('No available Gemini model');
}

export async function tutorChat(
  userId: string,
  sessionId: string,
  userMessage: string,
  imageDataUrl?: string
): Promise<{ reply: string; chatId: string }> {
  let chat = await AiChatHistory.findOne({ user_id: userId, session_id: sessionId });
  if (!chat) {
    chat = await AiChatHistory.create({
      user_id: new Types.ObjectId(userId),
      session_id: sessionId,
      messages: [],
    });
  }

  const userContent = imageDataUrl ? `${userMessage}\n\n[Image attached by student]` : userMessage;
  chat.messages.push({ role: 'user', content: userContent, timestamp: new Date() });
  await chat.save();

  let reply = 'AI is not configured. Set GEMINI_API_KEY in .env.';
  try {
    const historyText = chat.messages
      .slice(-20)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');
    const contentParts: any[] = [
      TUTOR_SYSTEM_PROMPT,
      `Conversation:\n${historyText}`,
    ];
    if (imageDataUrl?.startsWith('data:image/')) {
      const commaIdx = imageDataUrl.indexOf(',');
      const meta = imageDataUrl.slice(5, commaIdx); // image/png;base64
      const b64 = imageDataUrl.slice(commaIdx + 1);
      const mimeType = meta.split(';')[0] || 'image/png';
      contentParts.push({
        inlineData: {
          data: b64,
          mimeType,
        },
      });
      contentParts.push(IMAGE_HINT_PROMPT);
    }
    const result = await generateWithFallback(contentParts);
    reply = result.response.text() || 'No response';
  } catch (e) {
    logger.warn('Gemini error', { error: String(e) });
    reply = 'AI service is temporarily unavailable for this API key. Please try again in a minute.';
  }

  chat.messages.push({ role: 'assistant', content: reply, timestamp: new Date() });
  chat.updated_at = new Date();
  await chat.save();

  return { reply, chatId: String(chat._id) };
}

export async function streamTutorChat(
  userId: string,
  sessionId: string,
  userMessage: string,
  imageDataUrl: string | undefined,
  onChunk: (text: string) => void
): Promise<string> {
  let chat = await AiChatHistory.findOne({ user_id: userId, session_id: sessionId });
  if (!chat) {
    chat = await AiChatHistory.create({
      user_id: new Types.ObjectId(userId),
      session_id: sessionId,
      messages: [],
    });
  }
  const userContent = imageDataUrl ? `${userMessage}\n\n[Image attached by student]` : userMessage;
  chat.messages.push({ role: 'user', content: userContent, timestamp: new Date() });
  await chat.save();

  let full = '';
  if (!env.geminiApiKey) {
    full = 'AI is not configured. Set GEMINI_API_KEY in .env.';
    onChunk(full);
  } else {
    try {
      const historyText = chat.messages
        .slice(-20)
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');
      const contentParts: any[] = [
        TUTOR_SYSTEM_PROMPT,
        `Conversation:\n${historyText}`,
      ];
      if (imageDataUrl?.startsWith('data:image/')) {
        const commaIdx = imageDataUrl.indexOf(',');
        const meta = imageDataUrl.slice(5, commaIdx);
        const b64 = imageDataUrl.slice(commaIdx + 1);
        const mimeType = meta.split(';')[0] || 'image/png';
        contentParts.push({
          inlineData: {
            data: b64,
            mimeType,
          },
        });
        contentParts.push(IMAGE_HINT_PROMPT);
      }
      const result = await generateStreamWithFallback(contentParts);
      for await (const chunk of result.stream) {
        const t = chunk.text();
        if (t) {
          full += t;
          onChunk(t);
        }
      }
    } catch (e) {
      full = 'AI service is temporarily unavailable for this API key. Please try again in a minute.';
      onChunk(full);
    }
  }

  chat.messages.push({ role: 'assistant', content: full, timestamp: new Date() });
  chat.updated_at = new Date();
  await chat.save();
  return String(chat._id);
}

export async function getHistory(userId: string) {
  return AiChatHistory.find({ user_id: userId }).sort({ updated_at: -1 }).lean();
}

export async function clearHistory(userId: string) {
  await AiChatHistory.deleteMany({ user_id: userId });
}

export async function aiStats(userId: string) {
  const sessions = await AiChatHistory.countDocuments({ user_id: userId });
  const msgs = await AiChatHistory.aggregate([
    { $match: { user_id: new Types.ObjectId(userId) } },
    { $project: { n: { $size: '$messages' } } },
    { $group: { _id: null, total: { $sum: '$n' } } },
  ]);
  return { sessions, messageCount: msgs[0]?.total ?? 0 };
}
