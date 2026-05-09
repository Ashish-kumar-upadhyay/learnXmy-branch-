const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
    console.log('Connected to MongoDB');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== ALL COLLECTIONS ===');
    collections.forEach(col => console.log(`- ${col.name}`));

    // Check users collection
    const usersCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`\n=== USERS COLLECTION ===`);
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

    // Check if profiles collection exists and has data
    if (collections.some(c => c.name === 'profiles')) {
      const profilesCount = await mongoose.connection.db.collection('profiles').countDocuments();
      console.log(`\n=== PROFILES COLLECTION ===`);
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
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();
