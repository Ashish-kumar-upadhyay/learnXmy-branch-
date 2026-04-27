import { User } from '../models/User.model';
import * as fileService from '../services/file.service';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/environment';

/**
 * Utility to clean up broken avatar URLs and orphaned files
 * This can be run periodically or as needed
 */
export async function cleanupBrokenAvatars() {
  console.log('Starting avatar cleanup...');
  
  try {
    // Get all users with avatar URLs
    const usersWithAvatars = await User.find({ 
      avatar_url: { $exists: true, $ne: null } 
    }).select('_id avatar_url').lean();
    
    let cleanedCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithAvatars) {
      try {
        const avatarUrl = user.avatar_url;
        if (!avatarUrl) continue;
        
        // Extract file ID from avatar URL
        const urlMatch = avatarUrl.match(/\/api\/files\/(.+)$/);
        if (!urlMatch) {
          // Invalid URL format, clear it
          await User.findByIdAndUpdate(user._id, { avatar_url: null });
          cleanedCount++;
          continue;
        }
        
        const fileId = urlMatch[1];
        const meta = await fileService.getMetaById(fileId);
        
        if (!meta) {
          // File metadata doesn't exist, clear the avatar URL
          await User.findByIdAndUpdate(user._id, { avatar_url: null });
          cleanedCount++;
          continue;
        }
        
        // Check if file exists on disk
        const filePath = path.resolve(env.uploadDir, meta.path);
        try {
          await fs.access(filePath);
          // File exists, keep the URL
        } catch {
          // File doesn't exist on disk, clean up
          await fileService.deleteMeta(fileId, String(user._id)).catch(() => {});
          await User.findByIdAndUpdate(user._id, { avatar_url: null });
          cleanedCount++;
        }
      } catch (error) {
        console.error(`Error cleaning avatar for user ${user._id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Avatar cleanup completed. Cleaned: ${cleanedCount}, Errors: ${errorCount}`);
    return { cleanedCount, errorCount };
    
  } catch (error) {
    console.error('Error during avatar cleanup:', error);
    throw error;
  }
}

/**
 * Clean up orphaned files (files without metadata or owner)
 */
export async function cleanupOrphanedFiles() {
  console.log('Starting orphaned file cleanup...');
  
  try {
    // This is a more complex operation that would require scanning the upload directory
    // and matching with database records. For now, we'll focus on avatar cleanup.
    console.log('Orphaned file cleanup not implemented yet');
    
  } catch (error) {
    console.error('Error during orphaned file cleanup:', error);
    throw error;
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  cleanupBrokenAvatars()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}
