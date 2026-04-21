import { VercelRequest, VercelResponse } from '@vercel/node';
import app from './src/app';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure Express sees the correct path.
  req.url = '/health';
  return app(req, res);
}
