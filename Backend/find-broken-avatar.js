const mongoose = require('mongoose');
require('dotenv').config();

async function findBrokenAvatar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    // Get all users to find the one with the broken URL
    const allUsers = await mongoose.connection.db.collection('users').find({}).toArray();
    
    console.log(`Total users: ${allUsers.length}`);
    
    let foundUser = null;
    
    for (const user of allUsers) {
      console.log(`\nUser: ${user.name || user.email || 'Unknown'}`);
      console.log(`Avatar URL: ${user.avatar_url || 'null'}`);
      
      if (user.avatar_url && user.avatar_url.includes('6a0011d1bf9e56d1bd1098f8')) {
        foundUser = user;
        console.log('🎯 FOUND USER WITH BROKEN AVATAR URL!');
      }
    }

    if (foundUser) {
      console.log(`\n=== Fixing user: ${foundUser.name || foundUser.email} ===`);
      
      // Get available files
      const availableFiles = await mongoose.connection.db.collection('filemetas').find({}).toArray();
      
      if (availableFiles.length > 0) {
        const fileToAssign = availableFiles[0];
        const newAvatarUrl = `/api/files/profile/${fileToAssign._id}`;
        
        // Update file owner
        await mongoose.connection.db.collection('filemetas').updateOne(
          { _id: fileToAssign._id },
          { $set: { owner_id: foundUser._id } }
        );
        
        // Update user avatar URL
        await mongoose.connection.db.collection('users').updateOne(
          { _id: foundUser._id },
          { $set: { avatar_url: newAvatarUrl } }
        );
        
        console.log(`✅ Fixed! New avatar URL: ${newAvatarUrl}`);
      } else {
        console.log('❌ No files available to assign');
      }
    } else {
      console.log('❌ User with broken avatar URL not found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findBrokenAvatar();
