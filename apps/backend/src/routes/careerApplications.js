const express = require('express');
const { body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const database = require('../database/connection');
const { asyncHandler } = require('../middleware/errorHandler');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { Resend } = require('resend');

const router = express.Router();

// Initialize Resend for email sending
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('⚠️  RESEND_API_KEY not found. Email functionality will be disabled.');
}

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `career-resume-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// AI Content Generation Helper - Enhanced with better prompts
function generateJobDescription(jobData) {
  const { title, department, location, type, summary, requirements = [], responsibilities = [] } = jobData;
  
  // Generate AI-driven job description (80-150 words)
  const companyName = process.env.COMPANY_NAME || 'Mastersolis Infotech';
  const locationText = location ? ` in ${location}` : ' (Remote/Hybrid)';
  const typeText = type === 'FULL_TIME' ? 'full-time' : type === 'PART_TIME' ? 'part-time' : type?.toLowerCase() || 'full-time';
  
  // Build comprehensive description
  let description = `Join ${companyName} as a ${title}${locationText}! `;
  
  // Add role overview
  if (summary) {
    description += summary.substring(0, 50) + '. ';
  } else {
    description += `We're seeking a talented ${title} to join our ${department} team and drive innovation. `;
  }
  
  // Add key responsibilities (if provided)
  if (responsibilities && responsibilities.length > 0) {
    const keyResponsibility = responsibilities[0].substring(0, 60);
    description += `In this ${typeText} role, you'll ${keyResponsibility.toLowerCase()}. `;
  } else {
    description += `You'll collaborate with cross-functional teams to deliver exceptional results and contribute to our mission of excellence. `;
  }
  
  // Add key requirements (if provided)
  if (requirements && requirements.length > 0) {
    const keyRequirement = requirements[0].substring(0, 50);
    description += `We're looking for candidates with ${keyRequirement.toLowerCase()}. `;
  } else {
    description += `The ideal candidate brings strong problem-solving skills, relevant experience, and a passion for continuous learning. `;
  }
  
  // Add culture/benefits
  description += `At ${companyName}, we foster a collaborative, inclusive environment where innovation thrives. `;
  description += `We offer competitive compensation, flexible work arrangements, and opportunities for professional growth. `;
  description += `If you're ready to make an impact and grow your career with a forward-thinking team, we'd love to hear from you!`;
  
  // Ensure word count is between 80-150 words
  const words = description.split(' ');
  if (words.length < 80) {
    // Add more content
    description += ` This position offers excellent career advancement opportunities and the chance to work on cutting-edge projects. `;
    description += `We value diversity and welcome applications from all qualified candidates. `;
    description += `Join us in shaping the future of technology and making a meaningful difference.`;
  } else if (words.length > 150) {
    // Trim to 150 words
    description = words.slice(0, 150).join(' ') + '...';
  }
  
  return description.trim();
}

// AI Email Generation Functions - Mastersolis Infotech
// Professional, warm, and informative tone for candidate communication
function generateAcknowledgmentEmail(companyName, jobTitle, candidateName) {
  return {
    subject: `Thank You for Applying to ${jobTitle} at ${companyName}`,
    body: `Hi ${candidateName},

Thank you for applying for the ${jobTitle} position at ${companyName}. We've received your application and our AI-powered screening system is reviewing your resume.

We appreciate your interest in joining our team and will update you on the next steps soon.

Best regards,
${companyName} HR Team`
  };
}

function generateInterviewInvitationEmail(companyName, jobTitle, candidateName, interviewLink, interviewDate = null, interviewTime = null) {
  let dateTimeInfo = '';
  if (interviewDate && interviewTime) {
    dateTimeInfo = `\n\nYour interview is scheduled for:\nDate: ${interviewDate}\nTime: ${interviewTime}`;
  }
  
  return {
    subject: `Interview Invitation – ${jobTitle} at ${companyName}`,
    body: `Hi ${candidateName},

Congratulations! Based on our AI screening, you've been shortlisted for the ${jobTitle} role at ${companyName}.${dateTimeInfo}

Please use the following link to schedule or join your interview: ${interviewLink}

We're excited to learn more about you and your experience.

Best of luck,
${companyName} Recruitment Team`
  };
}

function generateSelectionEmail(companyName, jobTitle, candidateName, nextSteps = null) {
  let nextStepsInfo = '';
  if (nextSteps) {
    nextStepsInfo = `\n\n${nextSteps}`;
  } else {
    nextStepsInfo = `\n\nOur HR team will reach out soon with details regarding your onboarding process.`;
  }
  
  return {
    subject: `Congratulations! You've Been Selected for ${jobTitle}`,
    body: `Hi ${candidateName},

We're thrilled to inform you that you've been selected for the ${jobTitle} position at ${companyName}.${nextStepsInfo}

Welcome aboard and congratulations once again!

Warm regards,
${companyName} HR Team`
  };
}

function generateRejectionEmail(companyName, jobTitle, candidateName, feedback = null) {
  let feedbackInfo = '';
  if (feedback) {
    feedbackInfo = `\n\n${feedback}`;
  } else {
    feedbackInfo = `\n\nAfter careful consideration, we've decided to move forward with other candidates.`;
  }
  
  return {
    subject: `Update on Your Application for ${jobTitle}`,
    body: `Hi ${candidateName},

Thank you for taking the time to interview for the ${jobTitle} position at ${companyName}.${feedbackInfo}

We truly appreciate your interest and encourage you to apply for future opportunities that match your skills.

Best wishes,
${companyName} Recruitment Team`
  };
}

// Generate interview reminder email
function generateInterviewReminderEmail(companyName, jobTitle, candidateName, interviewDate, interviewTime, meetingLink, interviewType = 'AI') {
  const dateFormatted = new Date(interviewDate).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return {
    subject: `Reminder: Your ${jobTitle} Interview Tomorrow`,
    body: `Hi ${candidateName},

This is a friendly reminder that you have an ${interviewType} interview scheduled for the ${jobTitle} position at ${companyName}.

Interview Details:
Date: ${dateFormatted}
Time: ${interviewTime || 'As scheduled'}
Type: ${interviewType} Interview
${meetingLink ? `Meeting Link: ${meetingLink}` : ''}

Please ensure you have a stable internet connection and a quiet environment for the interview. We recommend testing your audio and video equipment beforehand.

If you have any questions or need to reschedule, please contact us as soon as possible.

We look forward to speaking with you!

Best regards,
${companyName} Recruitment Team`
  };
}

// Generate shortlisting notification email
function generateShortlistingEmail(companyName, jobTitle, candidateName, nextSteps = null) {
  let nextStepsInfo = '';
  if (nextSteps) {
    nextStepsInfo = `\n\n${nextSteps}`;
  } else {
    nextStepsInfo = `\n\nOur recruitment team will be in touch shortly to schedule the next steps in our hiring process. This may include an AI-powered screening interview or a conversation with our hiring team.`;
  }
  
  return {
    subject: `Congratulations! You've Been Shortlisted for ${jobTitle}`,
    body: `Hi ${candidateName},

Great news! After reviewing your application for the ${jobTitle} position at ${companyName}, we're excited to inform you that you've been shortlisted for the next stage of our recruitment process.${nextStepsInfo}

We were particularly impressed with your qualifications and believe you could be a great fit for our team.

Thank you for your interest in ${companyName}, and we look forward to learning more about you.

Best regards,
${companyName} Recruitment Team`
  };
}

// Helper function to convert plain text email to HTML
function emailToHTML(emailBody, companyName, additionalInfo = null) {
  const lines = emailBody.split('\n');
  let html = '';
  
  lines.forEach(line => {
    if (line.trim() === '') {
      html += '<br>';
    } else if (line.startsWith('Hi ')) {
      html += `<p style="margin: 15px 0; font-size: 16px; color: #1f2937; font-weight: 500;">${line}</p>`;
    } else if (line.startsWith('Best regards,') || line.startsWith('Warm regards,') || line.startsWith('Best wishes,')) {
      html += `<p style="margin: 20px 0 10px 0; color: #374151;">${line}</p>`;
    } else if (line.startsWith(companyName)) {
      html += `<p style="margin: 5px 0; color: #1f2937; font-weight: 600;">${line}</p>`;
    } else if (line.includes('http://') || line.includes('https://')) {
      html += `<p style="margin: 15px 0;"><a href="${line.trim()}" style="color: #2563eb; text-decoration: none; font-weight: 500; background: #eff6ff; padding: 10px 20px; border-radius: 6px; display: inline-block;">${line.trim()}</a></p>`;
    } else if (line.startsWith('Date:') || line.startsWith('Time:')) {
      html += `<p style="margin: 5px 0; color: #374151; font-size: 14px;"><strong>${line}</strong></p>`;
    } else {
      html += `<p style="margin: 10px 0; color: #374151; line-height: 1.6;">${line}</p>`;
    }
  });
  
  if (additionalInfo) {
    html += additionalInfo;
  }
  
  return html;
}

// Generate company culture and benefits content
function generateCompanyCultureContent() {
  return {
    culture: `At our company, we believe in fostering an inclusive, collaborative environment where every team member can thrive. Our culture is built on trust, innovation, and a shared commitment to excellence. We celebrate diversity and encourage open communication, ensuring that every voice is heard and valued. Our team members are passionate about their work and support each other in achieving both personal and professional goals.`,
    
    benefits: {
      salary: `We offer competitive, market-leading compensation packages that reflect your skills, experience, and contributions. Our salary structure is designed to attract top talent while ensuring fairness and transparency. We regularly review and adjust compensation to remain competitive in the industry.`,
      
      health: `Your health and well-being are our priority. We provide comprehensive health, dental, and vision insurance plans for you and your family. Our wellness programs include mental health support, fitness initiatives, and preventive care services to help you maintain a healthy work-life balance.`,
      
      flexibility: `We understand that life happens, and flexibility is key to productivity and satisfaction. Enjoy flexible working hours, remote work options, and generous time-off policies. We trust our team members to manage their time effectively and deliver exceptional results.`,
      
      learning: `Continuous learning is at the heart of our growth. We invest in your professional development through training programs, conference attendance, online courses, and mentorship opportunities. Whether you want to learn new technologies, develop leadership skills, or explore different career paths, we're here to support your journey.`,
      
      teamEvents: `Building strong relationships is essential to our success. We organize regular team-building activities, company retreats, social events, and celebrations. From casual coffee chats to annual company gatherings, these events help us connect, collaborate, and create lasting memories together.`
    }
  };
}

// Submit job application (public endpoint)
router.post('/apply', upload.single('resume'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('jobId').notEmpty().withMessage('Job ID is required'),
  body('phone').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { name, email, jobId, phone, coverLetter } = req.body;

  // Validate job ID
  if (!ObjectId.isValid(jobId)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid job ID' 
    });
  }

  // Check if job exists and is published
  const job = await database.findOne('job_postings', { 
    _id: new ObjectId(jobId),
    status: 'PUBLISHED'
  });

  if (!job) {
    return res.status(404).json({ 
      success: false,
      message: 'Job posting not found or not available' 
    });
  }

  // Check if resume is uploaded
  if (!req.file) {
    return res.status(400).json({ 
      success: false,
      message: 'Resume file is required' 
    });
  }

  // Create application record
  const application = {
    name,
    email,
    phone: phone || '',
    jobId: new ObjectId(jobId),
    jobTitle: job.title,
    resumePath: req.file.path,
    resumeFileName: req.file.filename,
    resumeOriginalName: req.file.originalname,
    coverLetter: coverLetter || '',
    status: 'SUBMITTED',
    appliedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await database.insertOne('career_applications', application);

  // Get company name from environment or use default
  const companyName = process.env.COMPANY_NAME || 'Mastersolis Infotech';

  // Generate AI acknowledgment email
  const emailData = generateAcknowledgmentEmail(companyName, job.title, name);

  // Send acknowledgment email
  if (resend) {
    try {
      const htmlBody = emailToHTML(emailData.body, companyName, `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937; font-size: 16px;">Application Details</h3>
          <div style="color: #374151; font-size: 14px;">
            <p style="margin: 5px 0;"><strong>Position:</strong> ${job.title}</p>
            <p style="margin: 5px 0;"><strong>Department:</strong> ${job.department}</p>
            <p style="margin: 5px 0;"><strong>Applied On:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      `);

      await resend.emails.send({
        from: process.env.RESEND_FROM || 'Careers <onboarding@resend.dev>',
        to: [email],
        subject: emailData.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">${companyName}</h1>
              <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">AI-Driven HRMS Solutions</p>
            </div>
            
            <div style="margin: 20px 0;">
              ${htmlBody}
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              This is an automated email. For inquiries, contact: ${process.env.HR_EMAIL || 'hr@mastersolis.com'}
            </p>
          </div>
        `
      });

      console.log('✅ AI-generated acknowledgment email sent to:', email);
    } catch (emailError) {
      console.error('❌ Failed to send acknowledgment email:', emailError);
      // Don't fail the application if email fails
    }
  }

  // Send EmailJS auto-reply (as backup or additional confirmation)
  const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
  const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
  
  if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
    try {
      const axios = require('axios');
      const emailjsPayload = {
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_name: name,
          to_email: email,
          job_applied: job.title,
          application_id: result.insertedId.toString(),
          summary: `Thank you for applying to ${job.title} at ${companyName}. We have received your application and will review it shortly.`
        }
      };

      await axios.post('https://api.emailjs.com/api/v1.0/email/send', emailjsPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      console.log('✅ EmailJS auto-reply sent to:', email);
    } catch (emailjsError) {
      console.error('❌ Failed to send EmailJS auto-reply:', emailjsError.message);
      // Don't fail the application if EmailJS fails
    }
  }

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: {
      applicationId: result.insertedId,
      jobTitle: job.title,
      appliedAt: application.appliedAt
    }
  });
}));

// Get company culture and benefits content (public endpoint)
router.get('/culture-benefits', asyncHandler(async (req, res) => {
  const content = generateCompanyCultureContent();
  
  res.json({
    success: true,
    data: content
  });
}));

// Generate AI job description (for admin)
router.post('/generate-description', [
  body('title').notEmpty().withMessage('Job title is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('location').optional().isString(),
  body('type').optional().isString(),
  body('summary').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { title, department, location, type, summary } = req.body;
  
  const description = generateJobDescription({
    title,
    department,
    location: location || 'Remote',
    type: type || 'Full-time',
    summary: summary || ''
  });

  res.json({
    success: true,
    data: {
      description,
      wordCount: description.split(' ').length
    }
  });
}));

// Send Interview Invitation Email (Admin/HR only)
router.post('/send-interview-invitation', verifyToken, checkRole('ADMIN', 'HR'), [
  body('applicationId').notEmpty().withMessage('Application ID is required'),
  body('interviewLink').notEmpty().withMessage('Interview link is required'),
  body('interviewDate').optional().isString(),
  body('interviewTime').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { applicationId, interviewLink, interviewDate, interviewTime } = req.body;
  const companyName = process.env.COMPANY_NAME || 'Mastersolis Infotech';

  // Get application details
  if (!ObjectId.isValid(applicationId)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid application ID' 
    });
  }

  const application = await database.findOne('career_applications', { 
    _id: new ObjectId(applicationId) 
  });

  if (!application) {
    return res.status(404).json({ 
      success: false,
      message: 'Application not found' 
    });
  }

  // Generate AI interview invitation email
  const emailData = generateInterviewInvitationEmail(
    companyName,
    application.jobTitle,
    application.name,
    interviewLink,
    interviewDate,
    interviewTime
  );

  // Send email
  if (resend) {
    try {
      const htmlBody = emailToHTML(emailData.body, companyName, `
        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #166534; font-size: 16px;">📅 Interview Details</h3>
          <div style="color: #374151; font-size: 14px;">
            <p style="margin: 5px 0;"><strong>Position:</strong> ${application.jobTitle}</p>
            ${interviewDate ? `<p style="margin: 5px 0;"><strong>Date:</strong> ${interviewDate}</p>` : ''}
            ${interviewTime ? `<p style="margin: 5px 0;"><strong>Time:</strong> ${interviewTime}</p>` : ''}
            <p style="margin: 10px 0 5px 0;"><strong>Interview Link:</strong></p>
            <a href="${interviewLink}" style="color: #2563eb; word-break: break-all;">${interviewLink}</a>
          </div>
        </div>
      `);

      await resend.emails.send({
        from: process.env.RESEND_FROM || 'Careers <onboarding@resend.dev>',
        to: [application.email],
        subject: emailData.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">${companyName}</h1>
              <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">AI-Driven HRMS Solutions</p>
            </div>
            
            <div style="margin: 20px 0;">
              ${htmlBody}
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              This is an automated email. For inquiries, contact: ${process.env.HR_EMAIL || 'hr@mastersolis.com'}
            </p>
          </div>
        `
      });

      // Update application status
      await database.updateOne(
        'career_applications',
        { _id: new ObjectId(applicationId) },
        { 
          $set: { 
            status: 'INTERVIEW_SCHEDULED',
            interviewLink,
            interviewDate: interviewDate || null,
            interviewTime: interviewTime || null,
            interviewInvitedAt: new Date(),
            updatedAt: new Date()
          }
        }
      );

      console.log('✅ AI-generated interview invitation email sent to:', application.email);

      res.json({
        success: true,
        message: 'Interview invitation email sent successfully',
        data: {
          email: application.email,
          candidateName: application.name,
          jobTitle: application.jobTitle
        }
      });
    } catch (emailError) {
      console.error('❌ Failed to send interview invitation email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send interview invitation email',
        error: emailError.message
      });
    }
  } else {
    res.status(500).json({
      success: false,
      message: 'Email service not configured'
    });
  }
}));

// Send Selection/Rejection Email (Admin/HR only)
router.post('/send-decision-email', verifyToken, checkRole('ADMIN', 'HR'), [
  body('applicationId').notEmpty().withMessage('Application ID is required'),
  body('decision').isIn(['SELECTED', 'REJECTED']).withMessage('Decision must be SELECTED or REJECTED'),
  body('nextSteps').optional().isString(),
  body('feedback').optional().isString()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { applicationId, decision, nextSteps, feedback } = req.body;
  const companyName = process.env.COMPANY_NAME || 'Mastersolis Infotech';

  // Get application details
  if (!ObjectId.isValid(applicationId)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid application ID' 
    });
  }

  const application = await database.findOne('career_applications', { 
    _id: new ObjectId(applicationId) 
  });

  if (!application) {
    return res.status(404).json({ 
      success: false,
      message: 'Application not found' 
    });
  }

  // Generate AI email based on decision
  let emailData;
  if (decision === 'SELECTED') {
    emailData = generateSelectionEmail(companyName, application.jobTitle, application.name, nextSteps);
  } else {
    emailData = generateRejectionEmail(companyName, application.jobTitle, application.name, feedback);
  }

  // Send email
  if (resend) {
    try {
      const additionalInfo = decision === 'SELECTED' 
        ? `
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #166534; font-size: 16px;">🎉 Welcome to ${companyName}!</h3>
            <p style="margin: 5px 0; color: #374151; font-size: 14px;">We're excited to have you join our team. Our HR team will contact you shortly with onboarding details.</p>
          </div>
        `
        : `
          <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #374151; font-size: 14px;">We appreciate your interest and encourage you to explore other opportunities with us in the future.</p>
          </div>
        `;

      const htmlBody = emailToHTML(emailData.body, companyName, additionalInfo);

      await resend.emails.send({
        from: process.env.RESEND_FROM || 'Careers <onboarding@resend.dev>',
        to: [application.email],
        subject: emailData.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">${companyName}</h1>
              <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">AI-Driven HRMS Solutions</p>
            </div>
            
            <div style="margin: 20px 0;">
              ${htmlBody}
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              This is an automated email. For inquiries, contact: ${process.env.HR_EMAIL || 'hr@mastersolis.com'}
            </p>
          </div>
        `
      });

      // Update application status
      await database.updateOne(
        'career_applications',
        { _id: new ObjectId(applicationId) },
        { 
          $set: { 
            status: decision === 'SELECTED' ? 'SELECTED' : 'REJECTED',
            decisionDate: new Date(),
            decisionFeedback: feedback || null,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ AI-generated ${decision.toLowerCase()} email sent to:`, application.email);

      res.json({
        success: true,
        message: `${decision === 'SELECTED' ? 'Selection' : 'Rejection'} email sent successfully`,
        data: {
          email: application.email,
          candidateName: application.name,
          jobTitle: application.jobTitle,
          decision
        }
      });
    } catch (emailError) {
      console.error(`❌ Failed to send ${decision.toLowerCase()} email:`, emailError);
      res.status(500).json({
        success: false,
        message: `Failed to send ${decision.toLowerCase()} email`,
        error: emailError.message
      });
    }
  } else {
    res.status(500).json({
      success: false,
      message: 'Email service not configured'
    });
  }
}));

// Send interview reminder email (Admin/HR only)
router.post('/send-interview-reminder', verifyToken, checkRole('ADMIN', 'HR'), [
  body('interviewId').notEmpty().withMessage('Interview ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { interviewId } = req.body;
  const companyName = process.env.COMPANY_NAME || 'Mastersolis Infotech';

  // Get interview details
  if (!ObjectId.isValid(interviewId)) {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid interview ID' 
    });
  }

  const interview = await database.findOne('interviews', { 
    _id: new ObjectId(interviewId) 
  });

  if (!interview) {
    return res.status(404).json({ 
      success: false,
      message: 'Interview not found' 
    });
  }

  // Get candidate and job posting details
  const candidate = await database.findOne('candidates', { _id: interview.candidateId });
  const jobPosting = await database.findOne('job_postings', { _id: interview.jobPostingId });

  if (!candidate || !jobPosting) {
    return res.status(404).json({ 
      success: false,
      message: 'Candidate or job posting not found' 
    });
  }

  // Generate reminder email
  const emailData = generateInterviewReminderEmail(
    companyName,
    jobPosting.title,
    candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
    interview.scheduledAt,
    new Date(interview.scheduledAt).toLocaleTimeString(),
    interview.meetingLink,
    interview.interviewType || 'AI'
  );

  // Send email
  if (resend) {
    try {
      const htmlBody = emailToHTML(emailData.body, companyName);

      await resend.emails.send({
        from: process.env.RESEND_FROM || 'Careers <onboarding@resend.dev>',
        to: [candidate.email],
        subject: emailData.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">${companyName}</h1>
              <p style="color: #6b7280; margin: 5px 0; font-size: 14px;">AI-Driven HRMS Solutions</p>
            </div>
            
            <div style="margin: 20px 0;">
              ${htmlBody}
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">
              This is an automated reminder. For inquiries, contact: ${process.env.HR_EMAIL || 'hr@mastersolis.com'}
            </p>
          </div>
        `
      });

      console.log('✅ Interview reminder email sent to:', candidate.email);

      res.json({
        success: true,
        message: 'Interview reminder email sent successfully',
        data: {
          email: candidate.email,
          candidateName: candidate.name || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim(),
          interviewDate: interview.scheduledAt
        }
      });
    } catch (emailError) {
      console.error('❌ Failed to send interview reminder email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send interview reminder email',
        error: emailError.message
      });
    }
  } else {
    res.status(500).json({
      success: false,
      message: 'Email service not configured'
    });
  }
}));

// Export email generation functions for use in other routes
module.exports = router;
module.exports.generateAcknowledgmentEmail = generateAcknowledgmentEmail;
module.exports.generateInterviewInvitationEmail = generateInterviewInvitationEmail;
module.exports.generateSelectionEmail = generateSelectionEmail;
module.exports.generateRejectionEmail = generateRejectionEmail;
module.exports.generateInterviewReminderEmail = generateInterviewReminderEmail;
module.exports.generateShortlistingEmail = generateShortlistingEmail;
module.exports.emailToHTML = emailToHTML;

