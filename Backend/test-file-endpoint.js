const mongoose = require('mongoose');
require('dotenv').config();

async function testFileEndpoint() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    // Get Ashish's file
    const ashish = await mongoose.connection.db.collection('users').findOne({
      email: 'ashishkumarupadhyay0328@gmail.com'
    });

    if (!ashish || !ashish.avatar_url) {
      console.log('❌ Ashish or avatar URL not found');
      return;
    }

    const fileId = ashish.avatar_url.split('/').pop();
    console.log(`Testing file ID: ${fileId}`);

    // Test the file endpoint by simulating the controller logic
    const fileMeta = await mongoose.connection.db.collection('filemetas').findOne({ _id: fileId });
    
    if (!fileMeta) {
      console.log('❌ File not found in database');
      return;
    }

    console.log('✅ File found in database:');
    console.log(`Path: ${fileMeta.path}`);
    console.log(`MIME: ${fileMeta.mime}`);
    console.log(`Owner: ${fileMeta.owner_id}`);

    // Check file on disk
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, 'uploads');
    const filePath = path.join(uploadsDir, fileMeta.path);
    
    console.log(`\nFile path: ${filePath}`);
    console.log(`File exists: ${fs.existsSync(filePath)}`);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`File size: ${stats.size} bytes`);
      console.log('✅ File should be accessible via /api/files/profile/' + fileId);
    } else {
      console.log('❌ File not found on disk');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testFileEndpoint();
