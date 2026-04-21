import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Handle the request through the Express app
  app(req, res);
}
