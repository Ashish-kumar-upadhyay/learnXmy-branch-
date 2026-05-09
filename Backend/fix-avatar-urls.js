const mongoose = require('mongoose');
require('dotenv').config();

async function fixAvatarUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lms');
    console.log('Connected to LMS database');

    // Get all users with avatar_url
    const users = await mongoose.connection.db.collection('users')
      .find({ avatar_url: { $exists: true, $ne: null } })
      .toArray();

    console.log(`Found ${users.length} users with avatar_url`);

    for (const user of users) {
      console.log(`\nUser: ${user.name}`);
      console.log(`Current avatar_url: ${user.avatar_url}`);
      
      // Fix the URL - replace production URL with local URL
      const oldUrl = user.avatar_url;
      const fileId = oldUrl.split('/').pop(); // Get file ID from URL
      
      // Update to local URL
      const newUrl = `http://localhost:5000/api/files/${fileId}`;
      
      await mongoose.connection.db.collection('users').updateOne(
        { _id: user._id },
        { $set: { avatar_url: newUrl } }
      );
      
      console.log(`Updated to: ${newUrl}`);
    }

    console.log('\n✅ Avatar URLs fixed! Now try uploading a new profile picture.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixAvatarUrls();
