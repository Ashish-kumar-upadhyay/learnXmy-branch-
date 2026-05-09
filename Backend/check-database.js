const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to database');
    
    // Check current database name
    const dbName = mongoose.connection.name;
    console.log(`Current database: ${dbName}`);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n=== ALL COLLECTIONS ===');
    collections.forEach(col => console.log(`- ${col.name}`));

    // Check users collection count
    const usersCount = await mongoose.connection.db.collection('users').countDocuments();
    console.log(`\nUsers collection count: ${usersCount}`);

    if (usersCount > 0) {
      const users = await mongoose.connection.db.collection('users').find().limit(3).toArray();
      console.log('\nFirst few users:');
      users.forEach(user => {
        console.log(`- ${user.name || user.email} (avatar: ${user.avatar_url || 'NULL'})`);
      });
    }

  } catch (error) {
    console.error('Database check error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();
