const mongoose = require('mongoose');
require('dotenv').config();

async function fixUserAvatar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    // Find the user with the broken avatar URL
    const user = await mongoose.connection.db.collection('users').findOne({
      avatar_url: "/api/files/avatar/6a0011d1bf9e56d1bd1098f8"
    });

    if (!user) {
      console.log('User with broken avatar URL not found');
      await mongoose.connection.close();
      return;
    }

    console.log(`Found user: ${user.name || user.email}`);
    console.log(`Current avatar_url: ${user.avatar_url}`);

    // Get all available files
    const availableFiles = await mongoose.connection.db.collection('filemetas').find({}).toArray();
    console.log(`\nAvailable files: ${availableFiles.length}`);

    if (availableFiles.length > 0) {
      // Assign the first available file to this user
      const assignedFile = availableFiles[0];
      const newAvatarUrl = `/api/files/profile/${assignedFile._id}`;
      
      // Update the file's owner to this user
      await mongoose.connection.db.collection('filemetas').updateOne(
        { _id: assignedFile._id },
        { $set: { owner_id: user._id } }
      );
      
      // Update user's avatar URL
      await mongoose.connection.db.collection('users').updateOne(
        { _id: user._id },
        { $set: { avatar_url: newAvatarUrl } }
      );
      
      console.log(`✅ Assigned file ${assignedFile._id} to user ${user.name || user.email}`);
      console.log(`✅ Updated avatar_url to: ${newAvatarUrl}`);
    } else {
      console.log('No available files to assign');
    }

    // Verify the fix
    console.log('\n=== Verification ===');
    const updatedUser = await mongoose.connection.db.collection('users').findOne({ _id: user._id });
    console.log(`Final avatar_url: ${updatedUser.avatar_url}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixUserAvatar();
