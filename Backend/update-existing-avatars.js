const mongoose = require('mongoose');
require('dotenv').config();

async function updateExistingAvatars() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to database');

    const User = mongoose.connection.db.collection('users');
    
    // Find all users with avatar_url that starts with /api/files/ but not /api/files/avatar/ (old format)
    const usersWithOldAvatars = await User.find({
      avatar_url: { 
        $regex: '^/api/files/', 
        $not: /^\/api\/files\/avatar\//  // Exclude the new format
      }
    }).toArray();

    console.log(`\n=== FOUND ${usersWithOldAvatars.length} USERS WITH OLD AVATAR FORMAT ===`);

    for (const user of usersWithOldAvatars) {
      const oldUrl = user.avatar_url;
      // Extract the file ID from the old URL
      const fileId = oldUrl.replace('/api/files/', '');
      const newUrl = `/api/files/avatar/${fileId}`;
      
      // Update to new format
      await User.updateOne(
        { _id: user._id },
        { $set: { avatar_url: newUrl } }
      );
      
      console.log(`✓ Updated ${user.name || user.email}:`);
      console.log(`  Old: ${oldUrl}`);
      console.log(`  New: ${newUrl}`);
    }

    // Verify updates
    const updatedUsers = await User.find({
      avatar_url: { $regex: '^/api/files/avatar/' }
    }).toArray();

    console.log(`\n=== VERIFICATION: ${updatedUsers.length} USERS NOW HAVE NEW AVATAR FORMAT ===`);
    updatedUsers.forEach(user => {
      console.log(`- ${user.name || user.email}: ${user.avatar_url}`);
    });

    console.log('\n=== UPDATE COMPLETE ===');
    console.log('All existing avatar URLs have been updated to the new format!');

  } catch (error) {
    console.error('Update error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

updateExistingAvatars();
