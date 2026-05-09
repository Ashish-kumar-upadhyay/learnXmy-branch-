const mongoose = require('mongoose');
require('dotenv').config();

async function fixProfileImages() {
  try {
    // Connect to the actual database the backend is using
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to LearnX database');

    // Check current database name
    const dbName = mongoose.connection.name;
    console.log(`Current database: ${dbName}`);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== ALL COLLECTIONS ===');
    collections.forEach(col => console.log(`- ${col.name}`));

    // Check users collection
    const usersCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`\n=== USERS COLLECTION ===`);
    console.log(`Total users: ${usersCount}`);
    
    if (usersCount > 0) {
      const users = await mongoose.connection.db.collection('users').find().limit(5).toArray();
      users.forEach(user => {
        console.log(`User ID: ${user._id}`);
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Avatar URL: ${user.avatar_url || 'NULL'}`);
        console.log('---');
      });
    }

    // Create/update profiles collection to match what frontend expects
    console.log('\n=== CREATING/UPDATING PROFILES COLLECTION ===');
    
    if (usersCount > 0) {
      const users = await mongoose.connection.db.collection('users').find().toArray();
      
      for (const user of users) {
        // Create profile document that matches frontend expectations
        const profileData = {
          user_id: user._id.toString(),
          full_name: user.name,
          email: user.email,
          avatar_url: user.avatar_url || null,
          batch: user.assignedClass || null,
          class_name: user.assignedClass || null,
          is_approved: user.is_approved ?? true,
          created_at: user.createdAt || new Date(),
          updated_at: user.updatedAt || new Date()
        };

        // Upsert to profiles collection
        await mongoose.connection.db.collection('profiles').updateOne(
          { user_id: user._id.toString() },
          { $set: profileData },
          { upsert: true }
        );
        
        console.log(`✓ Created/updated profile for user: ${user.name}`);
      }
    }

    // Verify profiles collection
    const profilesCount = await mongoose.connection.db.collection('profiles').countDocuments();
    console.log(`\n=== PROFILES COLLECTION AFTER FIX ===`);
    console.log(`Total profiles: ${profilesCount}`);
    
    if (profilesCount > 0) {
      const profiles = await mongoose.connection.db.collection('profiles').find().limit(3).toArray();
      profiles.forEach(profile => {
        console.log(`Profile ID: ${profile._id}`);
        console.log(`Full Name: ${profile.full_name}`);
        console.log(`User ID: ${profile.user_id}`);
        console.log(`Avatar URL: ${profile.avatar_url || 'NULL'}`);
        console.log('---');
      });
    }

    console.log('\n=== FIX COMPLETE ===');
    console.log('Profile images should now work correctly!');
    console.log('The profiles collection now has the same data as users collection plus avatar_url field.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixProfileImages();
