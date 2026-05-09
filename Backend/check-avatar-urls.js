const mongoose = require('mongoose');
require('dotenv').config();

async function checkAvatarUrls() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to database');

    const User = mongoose.connection.db.collection('users');
    
    // Find all users with avatar_url
    const usersWithAvatars = await User.find({
      avatar_url: { $exists: true, $ne: null }
    }).toArray();

    console.log(`\n=== FOUND ${usersWithAvatars.length} USERS WITH AVATAR_URL ===`);

    for (const user of usersWithAvatars) {
      console.log(`User: ${user.name || user.email}`);
      console.log(`Avatar URL: "${user.avatar_url}"`);
      console.log(`Starts with /api/files/: ${user.avatar_url.startsWith('/api/files/')}`);
      console.log(`Starts with /api/files/avatar/: ${user.avatar_url.startsWith('/api/files/avatar/')}`);
      console.log('---');
    }

    // Also check if the file exists in filemeta collection
    const FileMeta = mongoose.connection.db.collection('filemetas');
    
    for (const user of usersWithAvatars) {
      if (user.avatar_url && user.avatar_url.startsWith('/api/files/')) {
        const fileId = user.avatar_url.replace('/api/files/', '').replace('/api/files/avatar/', '');
        console.log(`\nChecking file ID: ${fileId}`);
        
        const fileMeta = await FileMeta.findOne({ _id: mongoose.Types.ObjectId(fileId) });
        if (fileMeta) {
          console.log(`✓ File found in filemetas collection:`);
          console.log(`  - Original name: ${fileMeta.original_name}`);
          console.log(`  - MIME type: ${fileMeta.mime}`);
          console.log(`  - Path: ${fileMeta.path}`);
          console.log(`  - Owner: ${fileMeta.owner_id}`);
        } else {
          console.log(`✗ File NOT found in filemetas collection`);
        }
      }
    }

  } catch (error) {
    console.error('Check error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAvatarUrls();
