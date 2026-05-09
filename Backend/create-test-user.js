const mongoose = require('mongoose');
require('dotenv').config();

async function createTestUser() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to database');
    
    const User = mongoose.connection.db.collection('users');
    
    // Create a test user with an avatar URL
    const testUser = {
      email: 'testuser@learnx.com',
      password: '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZ', // dummy hash
      name: 'Test User',
      role: 'student',
      assignedClass: '10',
      avatar_url: '/api/files/avatar/507f1f77bcf86cd799439011', // test avatar URL
      is_approved: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await User.insertOne(testUser);
    console.log(`✓ Created test user with ID: ${result.insertedId}`);
    console.log(`✓ Avatar URL: ${testUser.avatar_url}`);
    
    // Verify the user was created
    const createdUser = await User.findOne({ _id: result.insertedId });
    console.log(`✓ Verification - User found: ${createdUser.name}`);
    console.log(`✓ Verification - Avatar URL: ${createdUser.avatar_url}`);

  } catch (error) {
    console.error('Create test user error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUser();
