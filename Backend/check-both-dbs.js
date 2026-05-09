const mongoose = require('mongoose');

async function checkBothDatabases() {
  try {
    // Check LMS database first
    console.log('=== CHECKING LMS DATABASE ===');
    const lmsConn = await mongoose.createConnection('mongodb://127.0.0.1:27017/lms');
    
    try {
      const lmsCollections = await lmsConn.db.listCollections().toArray();
      console.log('Collections in LMS:', lmsCollections.map(c => c.name));

      if (lmsCollections.some(c => c.name === 'profiles')) {
        const profilesCount = await lmsConn.db.collection('profiles').countDocuments();
        console.log(`Found ${profilesCount} profiles in LMS`);
        
        if (profilesCount > 0) {
          const profiles = await lmsConn.db.collection('profiles').find().limit(3).toArray();
          profiles.forEach(profile => {
            console.log(`- ${profile.full_name} (avatar: ${profile.avatar_url || 'NULL'})`);
          });
        }
      }
    } catch (err) {
      console.log('LMS database error:', err.message);
    }
    
    await lmsConn.close();

    // Check LearnX database
    console.log('\n=== CHECKING LEARNX DATABASE ===');
    const learnxConn = await mongoose.createConnection('mongodb://127.0.0.1:27017/learnx');
    
    try {
      const learnxCollections = await learnxConn.db.listCollections().toArray();
      console.log('Collections in LearnX:', learnxCollections.map(c => c.name));

      const usersCount = await learnxConn.db.collection('users').countDocuments();
      console.log(`Found ${usersCount} users in LearnX`);
    } catch (err) {
      console.log('LearnX database error:', err.message);
    }
    
    await learnxConn.close();

    // Now let's fix the main issue - update backend to use LMS database
    console.log('\n=== SOLUTION ===');
    console.log('The issue is that your backend is using the "learnx" database');
    console.log('but you are looking at data in the "lms" database in MongoDB Compass.');
    console.log('');
    console.log('To fix this, you need to update your backend to use the LMS database.');
    console.log('');
    console.log('Please add this to your Backend .env file:');
    console.log('MONGODB_URI=mongodb://127.0.0.1:27017/lms');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkBothDatabases();
