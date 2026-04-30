import { User } from '../models/User.model.js';

/** Format: TCH + YYYY + 6-digit random, e.g. TCH2026123456 */
export async function generateUniqueTeacherCode(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `TCH${currentYear}`;

  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const teacherCode = `${prefix}${randomNum}`;

    const existing = await User.findOne({ teacherCode });
    if (!existing) {
      return teacherCode;
    }
    attempts += 1;
  }

  throw new Error('Failed to generate unique teacher code after maximum attempts');
}
