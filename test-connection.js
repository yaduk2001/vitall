// Test script to verify backend connection
const fetch = require('node-fetch');

const BACKEND_URL = 'http://localhost:5000';

async function testBackend() {
  console.log('🧪 Testing backend connection...\n');
  
  try {
    // Test root endpoint
    console.log('1. Testing root endpoint...');
    const rootResponse = await fetch(`${BACKEND_URL}/`);
    const rootData = await rootResponse.json();
    console.log('✅ Root endpoint:', rootData);
    
    // Test health endpoint
    console.log('\n2. Testing health endpoint...');
    const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health endpoint:', healthData);
    
    // Test messages endpoint
    console.log('\n3. Testing messages endpoint...');
    const messagesResponse = await fetch(`${BACKEND_URL}/api/messages`);
    const messagesData = await messagesResponse.json();
    console.log('✅ Messages endpoint:', messagesData);
    
    // Test POST message endpoint
    console.log('\n4. Testing POST message endpoint...');
    const postResponse = await fetch(`${BACKEND_URL}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'Test message from script!' })
    });
    const postData = await postResponse.json();
    console.log('✅ POST message endpoint:', postData);
    
    console.log('\n🎉 All tests passed! Backend is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 5000');
  }
}

testBackend();
