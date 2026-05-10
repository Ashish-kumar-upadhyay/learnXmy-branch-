const mongoose = require('mongoose');
require('dotenv').config();

async function checkFileIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    // Get all file records
    const files = await mongoose.connection.db.collection('filemetas').find({}).toArray();
    console.log('All file records:');
    files.forEach(file => {
      console.log(`File ID: ${file._id}, Type: ${typeof file._id}, Valid ObjectId: ${mongoose.Types.ObjectId.isValid(file._id)}`);
    });

    // Get all users with avatar URLs
    const users = await mongoose.connection.db.collection('users')
      .find({ avatar_url: { $exists: true, $ne: null } })
      .toArray();
    
    console.log('\nUsers with avatar URLs:');
    users.forEach(user => {
      const fileId = user.avatar_url.split('/').pop();
      console.log(`User: ${user.name}, Avatar URL: ${user.avatar_url}`);
      console.log(`Extracted File ID: ${fileId}, Valid ObjectId: ${mongoose.Types.ObjectId.isValid(fileId)}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFileIds();
