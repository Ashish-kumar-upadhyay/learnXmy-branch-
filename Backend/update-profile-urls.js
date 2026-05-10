const mongoose = require('mongoose');
require('dotenv').config();

async function updateProfileUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    // Get all users with avatar URLs
    const users = await mongoose.connection.db.collection('users')
      .find({ avatar_url: { $exists: true, $ne: null } })
      .toArray();
    
    console.log(`Found ${users.length} users with avatar URLs:`);
    
    for (const user of users) {
      console.log(`User: ${user.name}, Current URL: ${user.avatar_url}`);
      
      // Convert avatar URLs to profile URLs
      if (user.avatar_url && user.avatar_url.includes('/avatar/')) {
        const newUrl = user.avatar_url.replace('/avatar/', '/profile/');
        
        await mongoose.connection.db.collection('users').updateOne(
          { _id: user._id },
          { $set: { avatar_url: newUrl } }
        );
        
        console.log(`Updated to: ${newUrl}`);
      }
    }

    console.log('\n=== Update Complete ===');
    
    // Show final status
    const updatedUsers = await mongoose.connection.db.collection('users')
      .find({ avatar_url: { $exists: true, $ne: null } })
      .toArray();
    
    console.log('\nFinal user avatar URLs:');
    updatedUsers.forEach(user => {
      console.log(`User: ${user.name}, Avatar URL: ${user.avatar_url}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateProfileUrls();
