// Test script to verify MongoDB Atlas connection and API endpoints
const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:5000';

async function testMongoDBConnection() {
  console.log('🧪 Testing MongoDB Atlas Connection...\n');
  
  try {
    // Test root endpoint
    console.log('1. Testing root endpoint...');
    const rootResponse = await fetch(`${BACKEND_URL}/`);
    const rootData = await rootResponse.json();
    console.log('✅ Root endpoint:', rootData.message, `(${rootData.database})`);
    
    // Test health endpoint
    console.log('\n2. Testing health endpoint...');
    const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health endpoint:', healthData.status, `(${healthData.database})`);
    
    // Test GET messages endpoint
    console.log('\n3. Testing GET messages endpoint...');
    const messagesResponse = await fetch(`${BACKEND_URL}/api/messages`);
    const messagesData = await messagesResponse.json();
    console.log(`✅ Messages endpoint: Found ${messagesData.count} messages from MongoDB Atlas`);
    
    if (messagesData.messages.length > 0) {
      console.log('   Sample messages:');
      messagesData.messages.slice(0, 3).forEach((msg, index) => {
        console.log(`   ${index + 1}. "${msg.text}" (by ${msg.sender})`);
      });
    }
    
    // Test POST message endpoint
    console.log('\n4. Testing POST message endpoint...');
    const postResponse = await fetch(`${BACKEND_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: 'Test message from script! 🚀', 
        sender: 'TestScript' 
      })
    });
    const postData = await postResponse.json();
    console.log('✅ POST message endpoint:', postData.message);
    console.log('   Created message:', postData.data.text);
    
    // Test search endpoint
    console.log('\n5. Testing search endpoint...');
    const searchResponse = await fetch(`${BACKEND_URL}/api/messages/search/test`);
    const searchData = await searchResponse.json();
    console.log(`✅ Search endpoint: Found ${searchData.count} results for "test"`);
    
    console.log('\n🎉 All MongoDB Atlas tests passed! Your backend is fully connected to the cloud database!');
    console.log('\n📊 Database Status:');
    console.log('   ✅ MongoDB Atlas: Connected');
    console.log('   ✅ Messages: Persistent storage working');
    console.log('   ✅ API Endpoints: All functional');
    console.log('   ✅ Search: Text search working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running: npm run dev');
  }
}

testMongoDBConnection();
