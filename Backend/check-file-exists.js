const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function checkFileExists() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    // Check the specific file ID from the user
    const fileId = '6a0011d1bf9e56d1bd1098f8';
    console.log(`\n=== Checking file ID: ${fileId} ===`);
    
    const fileMeta = await mongoose.connection.db.collection('filemetas').findOne({ _id: fileId });
    console.log('FileMeta record:', fileMeta);
    
    if (fileMeta) {
      const uploadsDir = path.join(__dirname, 'uploads');
      const filePath = path.join(uploadsDir, fileMeta.path);
      console.log(`File path: ${filePath}`);
      console.log(`File exists: ${fs.existsSync(filePath)}`);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`File size: ${stats.size} bytes`);
      }
    } else {
      console.log('File record not found in database');
    }

    // Check all file records
    console.log('\n=== All file records ===');
    const allFiles = await mongoose.connection.db.collection('filemetas').find({}).toArray();
    console.log(`Total files in database: ${allFiles.length}`);
    
    allFiles.forEach(file => {
      const uploadsDir = path.join(__dirname, 'uploads');
      const filePath = path.join(uploadsDir, file.path);
      const exists = fs.existsSync(filePath);
      console.log(`File ID: ${file._id}, Path: ${file.path}, Exists: ${exists}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFileExists();
