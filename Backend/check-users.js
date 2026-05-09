const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lms');
    console.log('Connected to LMS database');

    // Get all users
    const users = await mongoose.connection.db.collection('users').find().toArray();
    console.log(`Total users: ${users.length}`);

    users.forEach(user => {
      console.log(`\n---`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Avatar URL: ${user.avatar_url || 'NULL'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUsers();
