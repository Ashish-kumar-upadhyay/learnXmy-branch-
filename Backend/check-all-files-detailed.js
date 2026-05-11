const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllFilesDetailed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    // Get all files
    const allFiles = await mongoose.connection.db.collection('filemetas').find({}).toArray();
    console.log(`Total files in database: ${allFiles.length}`);

    allFiles.forEach((file, index) => {
      console.log(`\n=== FILE ${index + 1} ===`);
      console.log(`ID: ${file._id}`);
      console.log(`Owner: ${file.owner_id}`);
      console.log(`Kind: ${file.kind}`);
      console.log(`Path: ${file.path}`);
      console.log(`MIME: ${file.mime}`);
      console.log(`Size: ${file.size}`);
    });

    // Check the specific file ID that Ashish is trying to use
    const targetFileId = '69ff2873ca1751289b08a061';
    const targetFile = allFiles.find(f => f._id.toString() === targetFileId);
    
    console.log(`\n=== LOOKING FOR FILE ID: ${targetFileId} ===`);
    console.log(`Found: ${targetFile ? 'YES' : 'NO'}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllFilesDetailed();
