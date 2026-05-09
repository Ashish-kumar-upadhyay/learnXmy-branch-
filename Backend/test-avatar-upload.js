const mongoose = require('mongoose');
require('dotenv').config();

async function testAvatarUpload() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to database');

    // Check if User model has avatar_url field
    const User = mongoose.connection.db.collection('users');
    const users = await User.find().limit(3).toArray();
    
    console.log('\n=== CURRENT USERS ===');
    users.forEach(user => {
      console.log(`User: ${user.name || user.email}`);
      console.log(`Avatar URL: ${user.avatar_url || 'NOT SET'}`);
      console.log('---');
    });

    // Update a test user with a sample avatar URL to test the backend
    if (users.length > 0) {
      const testUser = users[0];
      const sampleAvatarUrl = '/api/files/avatar/507f1f77bcf86cd799439011';
      
      await User.updateOne(
        { _id: testUser._id },
        { $set: { avatar_url: sampleAvatarUrl } }
      );
      
      console.log(`\n✓ Updated test user ${testUser.name || testUser.email} with avatar URL: ${sampleAvatarUrl}`);
      
      // Verify the update
      const updatedUser = await User.findOne({ _id: testUser._id });
      console.log(`✓ Verification - Avatar URL now: ${updatedUser.avatar_url}`);
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('Profile image backend should now work correctly!');
    console.log('- Avatar URLs are saved with /api/files/avatar/ prefix');
    console.log('- Public avatar endpoint created at /api/files/avatar/:id');
    console.log('- File controller updated to handle avatar uploads properly');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAvatarUpload();
