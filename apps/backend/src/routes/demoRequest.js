const express = require('express');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Initialize EmailJS
const initializeEmailJS = () => {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    console.warn('⚠️  EmailJS credentials not configured. Email functionality will not work.');
    console.warn('💡 Please set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, and EMAILJS_PRIVATE_KEY in your .env file');
    return null;
  }

  return {
    serviceId,
    templateId,
    publicKey,
    privateKey
  };
};

// Format email body with all form data (for template variables)
const formatEmailData = (formData) => {
  return {
    to_email: process.env.DEMO_REQUEST_EMAIL || 'abhi8861375377@gmail.com',
    from_name: formData.name || 'Website Visitor',
    from_email: formData.email || 'noreply@mastersolisinfotech.com',
    phone: formData.phone || 'Not provided',
    location: formData.location || 'Not provided',
    company_type: formData.companyType || 'Not provided',
    message: formData.message || 'Not provided',
    brochure: formData.brochure === 'yes' ? 'Yes, please send it' : 'No, thank you',
    submission_date: new Date().toLocaleString(),
    // HTML formatted message for email body
    email_body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #667eea; margin-bottom: 5px; display: block; }
    .value { color: #555; padding: 8px; background: white; border-radius: 4px; border-left: 3px solid #667eea; }
    .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🎯 New Demo Request</h2>
      <p style="margin: 0; opacity: 0.9;">A new demo request has been submitted through the website</p>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">👤 Full Name:</span>
        <div class="value">${formData.name || 'Not provided'}</div>
      </div>
      
      <div class="field">
        <span class="label">📧 Email:</span>
        <div class="value">${formData.email || 'Not provided'}</div>
      </div>
      
      <div class="field">
        <span class="label">📱 Phone Number:</span>
        <div class="value">${formData.phone || 'Not provided'}</div>
      </div>
      
      <div class="field">
        <span class="label">🌍 Location (Where are you from?):</span>
        <div class="value">${formData.location || 'Not provided'}</div>
      </div>
      
      <div class="field">
        <span class="label">🏢 Company Type:</span>
        <div class="value">${formData.companyType || 'Not provided'}</div>
      </div>
      
      <div class="field">
        <span class="label">💬 Message:</span>
        <div class="value" style="white-space: pre-wrap;">${formData.message || 'Not provided'}</div>
      </div>
      
      <div class="field">
        <span class="label">📄 Brochure Request:</span>
        <div class="value">${formData.brochure === 'yes' ? '✅ Yes, please send it' : '❌ No, thank you'}</div>
      </div>
    </div>
    <div class="footer">
      <p>This email was automatically generated from the Mastersolis Infotech website contact form.</p>
      <p>Submitted at: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };
};

// Send demo request email using EmailJS
router.post('/send-demo-request', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('location').optional().trim(),
  body('companyType').optional().trim(),
  body('message').optional().trim(),
  body('brochure').optional().isIn(['yes', 'no']).withMessage('Brochure preference must be yes or no'),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { name, email, phone, location, companyType, message, brochure } = req.body;

  // Initialize EmailJS configuration
  const emailjsConfig = initializeEmailJS();
  
  if (!emailjsConfig) {
    return res.status(500).json({
      success: false,
      message: 'Email service is not configured. Please contact the administrator.'
    });
  }

  try {
    // Prepare template parameters
    const templateParams = formatEmailData({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || '',
      location: location || '',
      companyType: companyType || '',
      message: message?.trim() || '',
      brochure: brochure || 'no'
    });

    // Send email using EmailJS REST API
    let response;
    try {
      // Use EmailJS REST API endpoint
      const emailjsUrl = `https://api.emailjs.com/api/v1.0/email/send`;
      
      response = await axios.post(emailjsUrl, {
        service_id: emailjsConfig.serviceId,
        template_id: emailjsConfig.templateId,
        user_id: emailjsConfig.publicKey,
        accessToken: emailjsConfig.privateKey,
        template_params: templateParams
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (emailError) {
      // Handle EmailJS specific errors
      if (emailError.response) {
        throw {
          status: emailError.response.status,
          message: emailError.response.data?.message || emailError.message || emailError.response.statusText,
          text: emailError.response.data
        };
      }
      throw emailError;
    }

    console.log('✅ Demo request email sent successfully via EmailJS');
    console.log('📧 Response Status:', response.status);
    console.log('👤 From:', name, `<${email}>`);
    console.log('📬 To:', templateParams.to_email);

    res.json({
      success: true,
      message: 'Demo request sent successfully!',
      emailId: response.data?.text || 'sent'
    });

  } catch (error) {
    console.error('❌ Error sending demo request email via EmailJS:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send email. Please try again later.';
    
    if (error.status === 400) {
      errorMessage = 'Invalid email template parameters. Please check configuration.';
    } else if (error.status === 401) {
      errorMessage = 'EmailJS authentication failed. Please check API keys.';
    } else if (error.status === 404) {
      errorMessage = 'EmailJS service or template not found. Please check configuration.';
    } else if (error.message) {
      errorMessage = `Email service error: ${error.message}`;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}));

module.exports = router;
