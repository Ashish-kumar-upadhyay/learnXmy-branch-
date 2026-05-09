const mongoose = require('mongoose');

async function syncDatabases() {
  try {
    // First, check the LMS database (where you see data in MongoDB Compass)
    console.log('=== CHECKING LMS DATABASE ===');
    const lmsConnection = await mongoose.createConnection('mongodb://127.0.0.1:27017/lms');
    
    const lmsCollections = await lmsConnection.db.listCollections().toArray();
    console.log('Collections in LMS:', lmsCollections.map(c => c.name));

    // Check profiles in LMS
    if (lmsCollections.some(c => c.name === 'profiles')) {
      const lmsProfiles = await lmsConnection.db.collection('profiles').find().toArray();
      console.log(`Found ${lmsProfiles.length} profiles in LMS database`);
      
      if (lmsProfiles.length > 0) {
        console.log('Sample profiles from LMS:');
        lmsProfiles.slice(0, 3).forEach(profile => {
          console.log(`- ${profile.full_name} (avatar: ${profile.avatar_url || 'NULL'})`);
        });
      }
    }

    await lmsConnection.close();

    // Now check the LearnX database (where backend stores data)
    console.log('\n=== CHECKING LEARNX DATABASE ===');
    const learnxConnection = await mongoose.createConnection('mongodb://127.0.0.1:27017/learnx');
    
    const learnxCollections = await learnxConnection.db.listCollections().toArray();
    console.log('Collections in LearnX:', learnxCollections.map(c => c.name));

    // Check users in LearnX
    const learnxUsers = await learnxConnection.db.collection('users').find().toArray();
    console.log(`Found ${learnxUsers.length} users in LearnX database`);

    await learnxConnection.close();

    // If LMS has data but LearnX doesn't, offer to migrate
    if (lmsCollections.some(c => c.name === 'profiles') && learnxUsers.length === 0) {
      console.log('\n=== MIGRATION NEEDED ===');
      console.log('LMS database has data but LearnX database is empty.');
      console.log('You need to either:');
      console.log('1. Update your backend to use the LMS database, OR');
      console.log('2. Migrate data from LMS to LearnX');
      
      // Let's update the backend to use LMS database instead
      console.log('\n=== UPDATING BACKEND TO USE LMS DATABASE ===');
      console.log('Updating environment configuration...');
      
      // This would require updating the .env file or MONGODB_URI
      console.log('Please update your .env file to use: MONGODB_URI=mongodb://127.0.0.1:27017/lms');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

syncDatabases();
