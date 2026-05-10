const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fixAvatarFiles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    const uploadsDir = path.join(__dirname, 'uploads');
    
    // Get all user directories
    const userDirs = fs.readdirSync(uploadsDir).filter(file => {
      const fullPath = path.join(uploadsDir, file);
      return fs.statSync(fullPath).isDirectory();
    });

    console.log('Found user directories:', userDirs);

    for (const userId of userDirs) {
      const userDir = path.join(uploadsDir, userId);
      
      // Check for 'other' directory that might contain avatars
      const otherDir = path.join(userDir, 'other');
      if (fs.existsSync(otherDir)) {
        const otherFiles = fs.readdirSync(otherDir);
        console.log(`User ${userId} has ${otherFiles.length} files in 'other':`, otherFiles);
        
        // Create avatar directory if it doesn't exist
        const avatarDir = path.join(userDir, 'avatar');
        if (!fs.existsSync(avatarDir)) {
          fs.mkdirSync(avatarDir, { recursive: true });
          console.log(`Created avatar directory for user ${userId}`);
        }
        
        for (const fileName of otherFiles) {
          // Only process image files
          if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            const oldPath = path.join(otherDir, fileName);
            const newPath = path.join(avatarDir, fileName);
            
            // Move file to avatar directory
            fs.renameSync(oldPath, newPath);
            console.log(`Moved ${fileName} from 'other' to 'avatar' directory`);
            
            // Create database record
            const filePath = path.join(userId, 'avatar', fileName);
            const fullPath = path.join(uploadsDir, filePath);
            const stats = fs.statSync(fullPath);
            
            // Detect MIME type
            const ext = path.extname(fileName).toLowerCase();
            let mime = 'image/jpeg';
            if (ext === '.png') mime = 'image/png';
            else if (ext === '.gif') mime = 'image/gif';
            else if (ext === '.webp') mime = 'image/webp';
            
            const fileMeta = {
              _id: new mongoose.Types.ObjectId(),
              owner_id: new mongoose.Types.ObjectId(userId),
              kind: 'avatar',
              path: filePath.replace(/\\/g, '/'),
              mime: mime,
              size: stats.size,
              original_name: fileName,
              created_at: new Date(stats.birthtime),
              updated_at: new Date(stats.mtime)
            };
            
            try {
              await mongoose.connection.db.collection('filemetas').insertOne(fileMeta);
              console.log(`Created file meta for ${fileName} with ID: ${fileMeta._id}`);
              
              // Update user's avatar_url - use the first image found as avatar
              const existingUser = await mongoose.connection.db.collection('users').findOne({
                _id: new mongoose.Types.ObjectId(userId)
              });
              
              if (existingUser && (!existingUser.avatar_url || existingUser.avatar_url.includes('507f1f77bcf86cd799439011'))) {
                const avatarUrl = `/api/files/avatar/${fileMeta._id}`;
                await mongoose.connection.db.collection('users').updateOne(
                  { _id: new mongoose.Types.ObjectId(userId) },
                  { $set: { avatar_url: avatarUrl } }
                );
                console.log(`Updated user ${userId} avatar_url to: ${avatarUrl}`);
              }
              
            } catch (error) {
              console.error(`Error processing ${fileName}:`, error.message);
            }
          }
        }
      }
    }

    console.log('\n=== Fix Complete ===');
    
    // Show updated status
    const updatedUsers = await mongoose.connection.db.collection('users')
      .find({ avatar_url: { $exists: true, $ne: null } })
      .toArray();
    
    console.log('\nUpdated users with avatars:');
    updatedUsers.forEach(user => {
      console.log(`User: ${user.name}, Avatar URL: ${user.avatar_url}`);
    });

    // Show all file records
    const allFiles = await mongoose.connection.db.collection('filemetas').find({}).toArray();
    console.log('\nAll file records in database:');
    allFiles.forEach(file => {
      console.log(`File ID: ${file._id}, Owner: ${file.owner_id}, Kind: ${file.kind}, Path: ${file.path}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAvatarFiles();
