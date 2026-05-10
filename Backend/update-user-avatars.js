const mongoose = require('mongoose');
require('dotenv').config();

async function updateUserAvatars() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('All users:');
    users.forEach(user => {
      console.log(`ID: ${user._id}, Name: ${user.name}, Email: ${user.email}, Current Avatar: ${user.avatar_url || 'null'}`);
    });

    // Get all file records
    const files = await mongoose.connection.db.collection('filemetas').find({}).toArray();
    console.log('\nAll file records:');
    files.forEach(file => {
      console.log(`File ID: ${file._id}, Owner: ${file.owner_id}, Kind: ${file.kind}`);
    });

    // Update users with correct avatar URLs
    for (const user of users) {
      const userFile = files.find(file => file.owner_id.toString() === user._id.toString() && file.kind === 'avatar');
      
      if (userFile) {
        const avatarUrl = `/api/files/avatar/${userFile._id}`;
        await mongoose.connection.db.collection('users').updateOne(
          { _id: user._id },
          { $set: { avatar_url: avatarUrl } }
        );
        console.log(`\nUpdated ${user.name} (${user.email}) with avatar URL: ${avatarUrl}`);
      } else {
        console.log(`\nNo avatar file found for ${user.name} (${user.email})`);
      }
    }

    console.log('\n=== Final Status ===');
    const updatedUsers = await mongoose.connection.db.collection('users')
      .find({ avatar_url: { $exists: true, $ne: null } })
      .toArray();
    
    console.log('Users with avatars:');
    updatedUsers.forEach(user => {
      console.log(`User: ${user.name}, Avatar URL: ${user.avatar_url}`);
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUserAvatars();
