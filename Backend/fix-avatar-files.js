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
      
      // Check for avatar subdirectory
      const avatarDir = path.join(userDir, 'avatar');
      if (fs.existsSync(avatarDir)) {
        const avatarFiles = fs.readdirSync(avatarDir);
        console.log(`User ${userId} has ${avatarFiles.length} avatar files:`, avatarFiles);
        
        for (const fileName of avatarFiles) {
          const filePath = path.join(userId, 'avatar', fileName);
          const fullPath = path.join(uploadsDir, filePath);
          const stats = fs.statSync(fullPath);
          
          // Create file meta record
          const fileMeta = {
            _id: new mongoose.Types.ObjectId(),
            owner_id: new mongoose.Types.ObjectId(userId),
            kind: 'avatar',
            path: filePath.replace(/\\/g, '/'),
            mime: 'image/jpeg', // Default, you might want to detect this
            size: stats.size,
            original_name: fileName,
            created_at: new Date(stats.birthtime),
            updated_at: new Date(stats.mtime)
          };
          
          try {
            await mongoose.connection.db.collection('filemetas').insertOne(fileMeta);
            console.log(`Created file meta for ${fileName} with ID: ${fileMeta._id}`);
            
            // Update user's avatar_url
            const avatarUrl = `/api/files/avatar/${fileMeta._id}`;
            await mongoose.connection.db.collection('users').updateOne(
              { _id: new mongoose.Types.ObjectId(userId) },
              { $set: { avatar_url: avatarUrl } }
            );
            console.log(`Updated user ${userId} avatar_url to: ${avatarUrl}`);
            
          } catch (error) {
            console.error(`Error processing ${fileName}:`, error.message);
          }
        }
      }
      
      // Also check 'other' directory for any images that might be avatars
      const otherDir = path.join(userDir, 'other');
      if (fs.existsSync(otherDir)) {
        const otherFiles = fs.readdirSync(otherDir);
        console.log(`User ${userId} has ${otherFiles.length} other files:`, otherFiles);
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

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAvatarFiles();
