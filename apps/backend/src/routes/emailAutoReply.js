// emailAutoReply.js - EmailJS Auto-Reply Service
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

const EMAILJS_API = 'https://api.emailjs.com/api/v1.0/email/send';
const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY; // EmailJS public/user id
const FALLBACK_RECIPIENT = process.env.EMAILJS_FALLBACK_RECIPIENT || ''; // optional test email

/**
 * POST /api/email/send-auto-reply
 * Body: { to_name, to_email, job_applied, application_id, summary }
 * 
 * Sends an auto-reply email to users after they submit an application
 */
router.post('/send-auto-reply', async (req, res) => {
  try {
    let { to_name, to_email, job_applied = 'General', application_id = 'N/A', summary = '' } = req.body || {};

    // Apply fallback recipient for testing if provided and if to_email is empty
    if ((!to_email || to_email === '') && FALLBACK_RECIPIENT) {
      console.warn('to_email missing in request — using fallback recipient from env');
      to_email = FALLBACK_RECIPIENT;
    }

    // Validate basic inputs
    if (!to_name || !to_email) {
      return res.status(400).json({ 
        ok: false, 
        error: 'to_name and to_email are required (or set EMAILJS_FALLBACK_RECIPIENT in .env)' 
      });
    }

    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      return res.status(500).json({ 
        ok: false, 
        error: 'EmailJS environment variables missing. Please set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY in .env' 
      });
    }

    // Build payload
    const payload = {
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        to_name,
        to_email,
        job_applied,
        application_id,
        summary,
        message: `Hi ${to_name}, we received your application for ${job_applied}. Application ID: ${application_id}`
      }
    };

    // Log payload for debugging (safe: do not log secrets)
    console.log('EmailJS payload ->', JSON.stringify(payload, null, 2));

    // Send request to EmailJS — include Origin + User-Agent headers to mimic browser
    try {
      const resp = await axios.post(EMAILJS_API, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
        }
      });

      // Successful send
      console.log('EmailJS send success:', resp.status, resp.data);
      return res.json({ 
        ok: true, 
        status: resp.status, 
        detail: resp.data 
      });
    } catch (axiosError) {
      // Handle axios errors
      const status = axiosError.response?.status || 500;
      const detail = axiosError.response?.data || axiosError.message;
      
      console.error('EmailJS API error:', status, detail);
      return res.status(status >= 500 ? 502 : status).json({ 
        ok: false, 
        status: status, 
        detail: detail 
      });
    }

  } catch (err) {
    console.error('Server error in /send-auto-reply:', err);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error', 
      detail: err.message 
    });
  }
});

/**
 * GET /api/email/health
 * Health check endpoint for email service
 */
router.get('/health', (req, res) => {
  const hasConfig = !!(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
  res.json({
    ok: true,
    service: 'EmailJS Auto-Reply',
    configured: hasConfig,
    hasFallback: !!FALLBACK_RECIPIENT,
    message: hasConfig 
      ? 'Email service is configured and ready' 
      : 'Email service is not fully configured. Check environment variables.'
  });
});

module.exports = router;

