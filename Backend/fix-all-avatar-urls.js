const mongoose = require('mongoose');
require('dotenv').config();

async function fixAllAvatarUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    // Get ALL users, not just ones with avatar_url
    const allUsers = await mongoose.connection.db.collection('users').find({}).toArray();
    
    console.log(`Total users found: ${allUsers.length}`);
    
    let updatedCount = 0;
    
    for (const user of allUsers) {
      if (user.avatar_url && user.avatar_url.includes('/avatar/')) {
        const newUrl = user.avatar_url.replace('/avatar/', '/profile/');
        
        await mongoose.connection.db.collection('users').updateOne(
          { _id: user._id },
          { $set: { avatar_url: newUrl } }
        );
        
        console.log(`✅ Updated ${user.name || user.email}: ${user.avatar_url} → ${newUrl}`);
        updatedCount++;
      } else if (user.avatar_url && user.avatar_url.includes('/profile/')) {
        console.log(`✅ Already updated ${user.name || user.email}: ${user.avatar_url}`);
      } else {
        console.log(`⚪ No avatar URL for ${user.name || user.email}`);
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Updated users: ${updatedCount}`);
    
    // Verify the updates
    console.log('\n=== Verification ===');
    const finalUsers = await mongoose.connection.db.collection('users')
      .find({ avatar_url: { $exists: true, $ne: null } })
      .toArray();
    
    finalUsers.forEach(user => {
      console.log(`${user.name || user.email}: ${user.avatar_url}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixAllAvatarUrls();
