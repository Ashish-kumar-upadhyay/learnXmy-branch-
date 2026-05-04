import { User } from '../models/User.model.js';

/**
 * Generates a unique student ID in format: STU + YYYY + 6-digit random number
 * Example: STU2024001234
 */
export async function generateUniqueStudentId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `STU${currentYear}`;
  
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    // Generate 6-digit random number
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const studentId = `${prefix}${randomNum}`;
    
    // Check if this ID already exists
    const existingUser = await User.findOne({ studentId });
    if (!existingUser) {
      return studentId;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique student ID after maximum attempts');
}

/**
 * Validates if a student ID follows the correct format
 * Format: STU + 4-digit year + 6-digit number
 */
export function validateStudentIdFormat(studentId: string): boolean {
  const pattern = /^STU\d{4}\d{6}$/;
  return pattern.test(studentId);
}

/**
 * Extract year from student ID
 */
export function extractYearFromStudentId(studentId: string): number | null {
  if (!validateStudentIdFormat(studentId)) {
    return null;
  }
  
  const yearStr = studentId.substring(3, 7);
  return parseInt(yearStr);
}

/**
 * Check if student ID is unique in the database
 */
export async function isStudentIdUnique(studentId: string, excludeUserId?: string): Promise<boolean> {
  const query: any = { studentId };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  
  const existingUser = await User.findOne(query);
  return !existingUser;
}
