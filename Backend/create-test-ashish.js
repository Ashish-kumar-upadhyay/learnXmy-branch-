const mongoose = require('mongoose');
require('dotenv').config();

async function createTestAshish() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    // Create Ashish user
    const ashishUser = {
      name: 'Ashish',
      email: 'ashishkumarupadhyay0328@gmail.com',
      password: '$2b$10$placeholder', // This would be hashed properly
      avatar_url: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await mongoose.connection.db.collection('users').insertOne(ashishUser);
    console.log(`✅ Created Ashish user with ID: ${result.insertedId}`);

    // Assign first available file to Ashish
    const availableFiles = await mongoose.connection.db.collection('filemetas').find({}).toArray();
    
    if (availableFiles.length > 0) {
      const fileToAssign = availableFiles[0];
      const newAvatarUrl = `/api/files/profile/${fileToAssign._id}`;
      
      // Update file owner
      await mongoose.connection.db.collection('filemetas').updateOne(
        { _id: fileToAssign._id },
        { $set: { owner_id: result.insertedId } }
      );
      
      // Update Ashish's avatar
      await mongoose.connection.db.collection('users').updateOne(
        { _id: result.insertedId },
        { $set: { avatar_url: newAvatarUrl } }
      );
      
      console.log(`✅ Assigned profile image: ${newAvatarUrl}`);
    }

    // Verify
    const createdUser = await mongoose.connection.db.collection('users').findOne({ _id: result.insertedId });
    console.log(`\n=== Created User ===`);
    console.log(`Name: ${createdUser.name}`);
    console.log(`Email: ${createdUser.email}`);
    console.log(`Avatar URL: ${createdUser.avatar_url}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestAshish();
