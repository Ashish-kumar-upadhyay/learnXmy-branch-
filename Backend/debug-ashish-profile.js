const mongoose = require('mongoose');
require('dotenv').config();

async function debugAshishProfile() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    // Find Ashish user
    const ashish = await mongoose.connection.db.collection('users').findOne({
      email: 'ashishkumarupadhyay0328@gmail.com'
    });

    if (!ashish) {
      console.log('❌ Ashish user not found');
      await mongoose.connection.close();
      return;
    }

    console.log('✅ Found Ashish user:');
    console.log(`ID: ${ashish._id}`);
    console.log(`Name: ${ashish.name}`);
    console.log(`Email: ${ashish.email}`);
    console.log(`Avatar URL: ${ashish.avatar_url}`);

    if (ashish.avatar_url) {
      const fileId = ashish.avatar_url.split('/').pop();
      console.log(`\nFile ID: ${fileId}`);

      // Check file in database
      const fileMeta = await mongoose.connection.db.collection('filemetas').findOne({ _id: fileId });
      console.log('File Meta:', fileMeta);

      if (fileMeta) {
        console.log(`File path: ${fileMeta.path}`);
        console.log(`File owner: ${fileMeta.owner_id}`);
        console.log(`Owner matches: ${fileMeta.owner_id.toString() === ashish._id.toString()}`);

        // Check if file exists on disk
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, 'uploads');
        const filePath = path.join(uploadsDir, fileMeta.path);
        console.log(`Full file path: ${filePath}`);
        console.log(`File exists on disk: ${fs.existsSync(filePath)}`);

        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          console.log(`File size: ${stats.size} bytes`);
        }
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugAshishProfile();
