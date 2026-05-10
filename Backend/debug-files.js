const mongoose = require('mongoose');
require('dotenv').config();

async function debugFiles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');
    
    // Check the specific file ID from the error
    const fileId = '69feb5d67a409760e34533a4';
    console.log('\n=== Checking file ID:', fileId, '===');
    
    const fileMeta = await mongoose.connection.db.collection('filemetas').findOne({ _id: fileId });
    console.log('FileMeta record:', fileMeta);
    
    // Check all user avatar URLs
    console.log('\n=== All users with avatar URLs ===');
    const usersWithAvatars = await mongoose.connection.db.collection('users').find({ avatar_url: { $exists: true, $ne: null } }).toArray();
    console.log('Users with avatars:', usersWithAvatars.length);
    
    usersWithAvatars.forEach(user => {
      console.log('User: ' + user.name + ', Avatar URL: ' + user.avatar_url);
    });
    
    // Check all file records
    console.log('\n=== All file records ===');
    const allFiles = await mongoose.connection.db.collection('filemetas').find({}).toArray();
    console.log('Total files in database:', allFiles.length);
    
    allFiles.forEach(file => {
      console.log('File ID: ' + file._id + ', Owner: ' + file.owner_id + ', Kind: ' + file.kind + ', Path: ' + file.path);
    });
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugFiles();
