const mongoose = require('mongoose');

async function checkLmsDatabase() {
  try {
    // Connect to the LMS database (the one you're looking at in MongoDB Compass)
    await mongoose.connect('mongodb://127.0.0.1:27017/lms');
    console.log('Connected to LMS database');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== ALL COLLECTIONS IN LMS ===');
    collections.forEach(col => console.log(`- ${col.name}`));

    // Check profiles collection
    if (collections.some(c => c.name === 'profiles')) {
      const profilesCount = await mongoose.connection.db.collection('profiles').countDocuments();
      console.log(`\n=== PROFILES COLLECTION ===`);
      console.log(`Total profiles: ${profilesCount}`);
      
      if (profilesCount > 0) {
        const profiles = await mongoose.connection.db.collection('profiles').find().limit(5).toArray();
        profiles.forEach(profile => {
          console.log(`Profile ID: ${profile._id}`);
          console.log(`Full Name: ${profile.full_name}`);
          console.log(`User ID: ${profile.user_id}`);
          console.log(`Avatar URL: ${profile.avatar_url || 'NULL'}`);
          console.log('---');
        });
      }
    }

    // Check users collection in LMS
    if (collections.some(c => c.name === 'users')) {
      const usersCount = await mongoose.connection.db.collection('users').countDocuments();
      console.log(`\n=== USERS COLLECTION IN LMS ===`);
      console.log(`Total users: ${usersCount}`);
      
      if (usersCount > 0) {
        const users = await mongoose.connection.db.collection('users').find().limit(3).toArray();
        users.forEach(user => {
          console.log(`User ID: ${user._id}`);
          console.log(`Name: ${user.name}`);
          console.log(`Email: ${user.email}`);
          console.log(`Avatar URL: ${user.avatar_url || 'NULL'}`);
          console.log('---');
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkLmsDatabase();
