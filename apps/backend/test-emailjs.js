/**
 * Test script to verify EmailJS configuration
 * Run with: node test-emailjs.js
 */

require('dotenv').config();
const axios = require('axios');

console.log('🔍 Checking EmailJS Configuration...\n');

// Check environment variables
const serviceId = process.env.EMAILJS_SERVICE_ID;
const templateId = process.env.EMAILJS_TEMPLATE_ID;
const publicKey = process.env.EMAILJS_PUBLIC_KEY;
const privateKey = process.env.EMAILJS_PRIVATE_KEY;
const recipientEmail = process.env.DEMO_REQUEST_EMAIL;

console.log('Environment Variables:');
console.log('  EMAILJS_SERVICE_ID:', serviceId ? '✅ Set' : '❌ Missing');
console.log('  EMAILJS_TEMPLATE_ID:', templateId ? '✅ Set' : '❌ Missing');
console.log('  EMAILJS_PUBLIC_KEY:', publicKey ? '✅ Set' : '❌ Missing');
console.log('  EMAILJS_PRIVATE_KEY:', privateKey ? '✅ Set' : '❌ Missing');
console.log('  DEMO_REQUEST_EMAIL:', recipientEmail || 'abhi8861375377@gmail.com');
console.log('  PORT:', process.env.PORT || '5000');
console.log('');

if (!serviceId || !templateId || !publicKey || !privateKey) {
  console.error('❌ Missing required EmailJS configuration!');
  console.error('Please check your .env file.');
  process.exit(1);
}

// Test email sending with sample data
console.log('📧 Testing EmailJS connection...\n');

const testTemplateParams = {
  to_email: recipientEmail || 'abhi8861375377@gmail.com',
  from_name: 'Test User',
  from_email: 'test@example.com',
  phone: '+1234567890',
  location: 'Test Country',
  company_type: 'Technology',
  message: 'This is a test message from the EmailJS integration setup.',
  brochure: 'Yes, please send it',
  submission_date: new Date().toLocaleString(),
  email_body: '<p>This is a test email to verify EmailJS integration.</p>'
};

// Use EmailJS REST API
const emailjsUrl = 'https://api.emailjs.com/api/v1.0/email/send';

axios
  .post(emailjsUrl, {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: testTemplateParams
  }, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then((response) => {
    console.log('✅ SUCCESS! Email sent successfully!');
    console.log('📧 Response Status:', response.status);
    console.log('📬 Email sent to:', recipientEmail || 'abhi8861375377@gmail.com');
    console.log('\n🎉 EmailJS integration is working correctly!');
    console.log('You can now submit demo requests from the contact form.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ ERROR: Failed to send test email');
    console.error('Error details:', error.message || error);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    console.log('\n💡 Troubleshooting:');
    console.log('1. Verify your EmailJS template (template_i11ufxn) is published');
    console.log('2. Check that all template variables match:');
    console.log('   - {{to_email}}, {{from_name}}, {{from_email}}, {{phone}}');
    console.log('   - {{location}}, {{company_type}}, {{message}}, {{brochure}}');
    console.log('   - {{submission_date}}, {{email_body}}');
    console.log('3. Verify your EmailJS service is connected and active');
    console.log('4. Check EmailJS dashboard for any errors');
    
    process.exit(1);
  });

