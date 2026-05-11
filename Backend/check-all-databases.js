const mongoose = require('mongoose');
require('dotenv').config();

async function checkAllDatabases() {
  try {
    // Try different database names
    const dbNames = ['learnx', 'learnx_my', 'learnx_branch', 'test'];
    
    for (const dbName of dbNames) {
      console.log(`\n=== Checking database: ${dbName} ===`);
      
      try {
        await mongoose.connect(process.env.MONGODB_URI || `mongodb://127.0.0.1:27017/${dbName}`);
        console.log(`✅ Connected to ${dbName}`);
        
        // Get all users
        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log(`Users found: ${users.length}`);
        
        // Look for user with name "Ashish" or email containing "ashish"
        const ashishUser = users.find(u => 
          (u.name && u.name.toLowerCase().includes('ashish')) || 
          (u.email && u.email.toLowerCase().includes('ashish'))
        );
        
        if (ashishUser) {
          console.log(`🎯 Found Ashish user:`);
          console.log(`Name: ${ashishUser.name}`);
          console.log(`Email: ${ashishUser.email}`);
          console.log(`Avatar URL: ${ashishUser.avatar_url}`);
          
          if (ashishUser.avatar_url && ashishUser.avatar_url.includes('6a0011d1bf9e56d1bd1098f8')) {
            console.log(`🔧 This user has the broken avatar URL!`);
            
            // Get available files to assign
            const files = await mongoose.connection.db.collection('filemetas').find({}).toArray();
            console.log(`Available files: ${files.length}`);
            
            if (files.length > 0) {
              const fileToAssign = files[0];
              const newAvatarUrl = `/api/files/profile/${fileToAssign._id}`;
              
              // Update file owner
              await mongoose.connection.db.collection('filemetas').updateOne(
                { _id: fileToAssign._id },
                { $set: { owner_id: ashishUser._id } }
              );
              
              // Update user avatar
              await mongoose.connection.db.collection('users').updateOne(
                { _id: ashishUser._id },
                { $set: { avatar_url: newAvatarUrl } }
              );
              
              console.log(`✅ Fixed! New avatar URL: ${newAvatarUrl}`);
            }
          }
        }
        
        await mongoose.connection.close();
        
      } catch (error) {
        console.log(`❌ Cannot connect to ${dbName}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAllDatabases();
