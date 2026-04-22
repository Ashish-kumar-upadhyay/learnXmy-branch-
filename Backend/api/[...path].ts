import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/app';
import { connectDatabase } from '../src/config/database';

let dbConnectPromise: Promise<void> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!dbConnectPromise) {
    dbConnectPromise = connectDatabase().catch((error) => {
      dbConnectPromise = null;
      throw error;
    });
  }
  await dbConnectPromise;
  return app(req, res);
}
