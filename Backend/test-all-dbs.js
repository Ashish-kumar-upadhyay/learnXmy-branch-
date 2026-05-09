const mongoose = require('mongoose');

async function testAllDatabases() {
  const databases = ['lms', 'learnx', 'learnxmy', 'lms_db'];
  
  for (const dbName of databases) {
    try {
      console.log(`\n=== Testing ${dbName} database ===`);
      const conn = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbName}`);
      
      const collections = await conn.db.listCollections().toArray();
      console.log('Collections:', collections.map(c => c.name));
      
      if (collections.some(c => c.name === 'users')) {
        const usersCount = await conn.db.collection('users').countDocuments();
        console.log(`Users count: ${usersCount}`);
        
        if (usersCount > 0) {
          const users = await conn.db.collection('users').find().limit(2).toArray();
          users.forEach(user => {
            console.log(`- ${user.name} (${user.email}) - Avatar: ${user.avatar_url ? 'YES' : 'NO'}`);
          });
        }
      }
      
      await conn.close();
    } catch (error) {
      console.log(`Error accessing ${dbName}: ${error.message}`);
    }
  }
}

testAllDatabases();
