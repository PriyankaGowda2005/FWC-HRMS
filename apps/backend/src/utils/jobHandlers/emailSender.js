// Email sending job handler
const nodemailer = require('nodemailer');

// Email templates
const emailTemplates = {
  resume_processed: {
    subject: 'New Resume Processed - Candidate Application',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Candidate Resume Processed</h2>
        <p>Hello HR Team,</p>
        <p>A new resume has been processed and is ready for your review:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Candidate Details</h3>
          <p><strong>Name:</strong> ${data.candidateName}</p>
          <p><strong>Job Title:</strong> ${data.jobTitle}</p>
          <p><strong>Fit Score:</strong> ${data.fitScore}/100</p>
        </div>
        
        <p>Please review the candidate's profile and schedule an interview if appropriate.</p>
        <p>Best regards,<br>FWC HRMS System</p>
      </div>
    `
  },
  
  interview_scheduled: {
    subject: 'Interview Scheduled - ${jobTitle} Position',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Interview Scheduled</h2>
        <p>Dear ${data.candidateName},</p>
        <p>Great news! Your interview has been scheduled. Here are the details:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Interview Details</h3>
          <p><strong>Position:</strong> ${data.jobTitle}</p>
          <p><strong>Date:</strong> ${data.interviewDate}</p>
          <p><strong>Time:</strong> ${data.interviewTime}</p>
          <p><strong>Type:</strong> ${data.interviewType}</p>
          ${data.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${data.meetingLink}">Join Interview</a></p>` : ''}
        </div>
        
        <p>Please ensure you arrive on time and are prepared to discuss your qualifications.</p>
        <p>Good luck!</p>
        <p>Best regards,<br>FWC HR Team</p>
      </div>
    `
  },
  
  application_received: {
    subject: 'Application Received - ${jobTitle}',
    html: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Application Received</h2>
        <p>Dear ${data.candidateName},</p>
        <p>Thank you for applying to the ${data.jobTitle} position at FWC.</p>
        <p>We have received your application and will review it shortly. You will hear from us within the next 2-3 business days.</p>
        <p>Thank you for your interest in joining our team!</p>
        <p>Best regards,<br>FWC HR Team</p>
      </div>
    `
  }
};

// Create transporter for different email providers
const createTransporter = () => {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  return nodemailer.createTransporter(emailConfig);
};

const sendEmail = async (jobData) => {
  const { type, to, data = {}, cc = [], bcc = [] } = jobData;
  
  try {
    console.log(`Sending ${type} email to ${to}`);
    
    const template = emailTemplates[type];
    if (!template) {
      throw new Error(`Email template '${type}' not found`);
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: cc.length > 0 ? cc.join(', ') : undefined,
      bcc: bcc.length > 0 ? bcc.join(', ') : undefined,
      subject: template.subject.replace(/\${(\w+)}/g, (match, key) => data[key] || match),
      html: template.html(data),
      text: template.html(data).replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent successfully: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
      recipient: to,
      type
    };

  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = sendEmail;
