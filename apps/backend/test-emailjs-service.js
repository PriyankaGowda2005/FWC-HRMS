// test-emailjs-service.js - Test script for EmailJS auto-reply service
const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function testEmailService() {
  console.log('🧪 Testing EmailJS Auto-Reply Service\n');
  console.log('='.repeat(60));

  // Test 1: Health Check
  console.log('\n1️⃣ Testing Health Check Endpoint...');
  try {
    const healthResponse = await axios.get(`${BASE_URL}/api/email/health`);
    console.log('✅ Health Check Response:');
    console.log(JSON.stringify(healthResponse.data, null, 2));
    
    if (!healthResponse.data.configured) {
      console.log('\n⚠️  Warning: EmailJS is not fully configured!');
      console.log('   Please check your .env file for:');
      console.log('   - EMAILJS_SERVICE_ID');
      console.log('   - EMAILJS_TEMPLATE_ID');
      console.log('   - EMAILJS_PUBLIC_KEY');
      return;
    }
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Backend server is not running!');
      console.error('   Please start the backend server first:');
      console.error('   cd apps/backend && npm start');
    }
    return;
  }

  // Test 2: Send Auto-Reply Email
  console.log('\n2️⃣ Testing Send Auto-Reply Endpoint...');
  try {
    const testEmailData = {
      to_name: 'Test User',
      to_email: process.env.EMAILJS_FALLBACK_RECIPIENT || 'test@example.com',
      job_applied: 'Software Engineer',
      application_id: `test-${Date.now()}`,
      summary: 'This is a test email from the EmailJS integration test script.'
    };

    console.log('📧 Sending test email with data:');
    console.log(JSON.stringify(testEmailData, null, 2));

    const emailResponse = await axios.post(
      `${BASE_URL}/api/email/send-auto-reply`,
      testEmailData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ Email Sent Successfully!');
    console.log('Response:', JSON.stringify(emailResponse.data, null, 2));
    console.log('\n📬 Check the recipient inbox for the email.');

  } catch (error) {
    console.error('\n❌ Email Send Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✨ Test completed!\n');
}

// Run the test
testEmailService().catch(console.error);

