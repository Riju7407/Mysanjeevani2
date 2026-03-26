// Direct MongoDB connection test
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://gk1204kr:GbxiGEitN2W2p1U3@cluster0.yxtklsn.mongodb.net/mysanjeevani';

async function testMongoDB() {
  console.log('Testing MongoDB Connection...\n');
  console.log('Connection String:', MONGODB_URI.substring(0, 50) + '...');
  
  try {
    const startTime = Date.now();
    
    const connection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      family: 4,
    });
    
    const duration = Date.now() - startTime;
    
    console.log('\n✅ MongoDB Connected Successfully!');
    console.log(`Connection Time: ${duration}ms`);
    console.log(`Host: ${connection.connection.host}`);
    console.log(`Database: ${connection.connection.db.databaseName}`);
    console.log(`Ready State: ${connection.connection.readyState} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
    
    // Try to list collections
    const collections = await connection.connection.db.listCollections().toArray();
    console.log(`\nCollections (${collections.length}):`);
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected gracefully');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ MongoDB Connection Failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('\n⚠️ DNS Resolution Failed - Check internet connection');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️ Connection Refused - MongoDB server not responding');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n⚠️ Authentication Failed - Check credentials');
    } else if (error.message.includes('timeout')) {
      console.error('\n⚠️ Connection Timeout - Network issue or MongoDB server slow');
    }
    
    process.exit(1);
  }
}

testMongoDB();
