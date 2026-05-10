const mongoose = require('mongoose');
require('dotenv').config();

async function fixAvatarMapping() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/learnx');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('All users:');
    users.forEach(user => {
      console.log(`ID: ${user._id}, Name: ${user.name}, Email: ${user.email}`);
    });

    // Get all file records
    const files = await mongoose.connection.db.collection('filemetas').find({}).toArray();
    console.log('\nAll file records:');
    files.forEach(file => {
      console.log(`File ID: ${file._id}, Owner: ${file.owner_id}, Kind: ${file.kind}`);
    });

    // Since we have 3 users and 3 avatar files, let's map them
    // We'll assign avatars to Demo Student and Demo Teacher since Test User already has one
    
    // Update file owner for first file to Demo Student
    const demoStudent = users.find(u => u.email === 'student@demo.com');
    const demoTeacher = users.find(u => u.email === 'teacher@demo.com');
    
    if (demoStudent && files.length >= 1) {
      // Update first file's owner to Demo Student
      await mongoose.connection.db.collection('filemetas').updateOne(
        { _id: files[0]._id },
        { $set: { owner_id: demoStudent._id } }
      );
      
      // Update Demo Student's avatar URL
      const avatarUrl = `/api/files/avatar/${files[0]._id}`;
      await mongoose.connection.db.collection('users').updateOne(
        { _id: demoStudent._id },
        { $set: { avatar_url: avatarUrl } }
      );
      
      console.log(`\nUpdated Demo Student with avatar: ${avatarUrl}`);
    }
    
    if (demoTeacher && files.length >= 2) {
      // Update second file's owner to Demo Teacher
      await mongoose.connection.db.collection('filemetas').updateOne(
        { _id: files[1]._id },
        { $set: { owner_id: demoTeacher._id } }
      );
      
      // Update Demo Teacher's avatar URL
      const avatarUrl = `/api/files/avatar/${files[1]._id}`;
      await mongoose.connection.db.collection('users').updateOne(
        { _id: demoTeacher._id },
        { $set: { avatar_url: avatarUrl } }
      );
      
      console.log(`Updated Demo Teacher with avatar: ${avatarUrl}`);
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

fixAvatarMapping();
