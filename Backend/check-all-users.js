const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllUsers() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to database');

    const User = mongoose.connection.db.collection('users');
    
    // Find all users
    const allUsers = await User.find({}).toArray();

    console.log(`\n=== FOUND ${allUsers.length} USERS TOTAL ===`);

    for (const user of allUsers) {
      console.log(`User: ${user.name || user.email}`);
      console.log(`Email: ${user.email}`);
      console.log(`Avatar URL: ${user.avatar_url || 'NULL'}`);
      console.log('---');
    }

  } catch (error) {
    console.error('Check error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAllUsers();
