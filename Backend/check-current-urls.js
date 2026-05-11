const mongoose = require('mongoose');
require('dotenv').config();

async function checkCurrentUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    // Get all users with avatar URLs
    const users = await mongoose.connection.db.collection('users')
      .find({ avatar_url: { $exists: true, $ne: null } })
      .toArray();
    
    console.log(`Found ${users.length} users with avatar URLs:`);
    
    users.forEach(user => {
      console.log(`\nUser: ${user.name || user.email}`);
      console.log(`Current URL: ${user.avatar_url}`);
      console.log(`Contains '/avatar/': ${user.avatar_url.includes('/avatar/')}`);
      console.log(`Contains '/profile/': ${user.avatar_url.includes('/profile/')}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCurrentUrls();
