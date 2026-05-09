const mongoose = require('mongoose');
require('dotenv').config();

async function debugProfileImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
    console.log('Connected to MongoDB');

    // Check users collection for avatar_url
    const usersWithAvatars = await mongoose.connection.db.collection('users')
      .find({ avatar_url: { $exists: true, $ne: null } })
      .toArray();
    
    console.log('\n=== USERS WITH AVATARS ===');
    console.log(`Found ${usersWithAvatars.length} users with avatar_url`);
    
    usersWithAvatars.forEach(user => {
      console.log(`User ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Avatar URL: ${user.avatar_url}`);
      console.log('---');
    });

    // Check profiles collection
    const profilesCount = await mongoose.connection.db.collection('profiles').countDocuments();
    console.log(`\n=== PROFILES COLLECTION ===`);
    console.log(`Total profiles: ${profilesCount}`);
    
    if (profilesCount > 0) {
      const sampleProfiles = await mongoose.connection.db.collection('profiles').find().limit(3).toArray();
      sampleProfiles.forEach(profile => {
        console.log(`Profile ID: ${profile._id}`);
        console.log(`Full Name: ${profile.full_name}`);
        console.log(`Has avatar_url: ${profile.avatar_url ? 'YES' : 'NO'}`);
        console.log('---');
      });
    }

    // Fix: Update profiles collection to include avatar_url from users
    if (usersWithAvatars.length > 0 && profilesCount > 0) {
      console.log('\n=== FIXING PROFILE IMAGES ===');
      
      for (const user of usersWithAvatars) {
        // Find corresponding profile
        const profile = await mongoose.connection.db.collection('profiles')
          .findOne({ user_id: user._id.toString() });
        
        if (profile && !profile.avatar_url) {
          await mongoose.connection.db.collection('profiles').updateOne(
            { _id: profile._id },
            { $set: { avatar_url: user.avatar_url } }
          );
          console.log(`Updated profile ${profile._id} with avatar_url`);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugProfileImages();
