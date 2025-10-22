const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../database/connection');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Get system settings
router.get('/', [
  authenticate,
  requireRole('ADMIN'),
  authorize('settings:read')
], asyncHandler(async (req, res) => {
  const settings = await database.findOne('system_settings', {});
  
  if (!settings) {
    // Return default settings if none exist
    const defaultSettings = {
      general: {
        systemName: 'FWC HRMS',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12',
        language: 'en',
        currency: 'USD',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        workingHours: { start: '09:00', end: '17:00' }
      },
      company: {
        companyName: '',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        taxId: '',
        registrationNumber: '',
        industry: '',
        companySize: '',
        foundedYear: ''
      },
      email: {
        smtpHost: '',
        smtpPort: 587,
        smtpUsername: '',
        smtpPassword: '',
        smtpSecure: false,
        fromEmail: '',
        fromName: '',
        emailNotifications: true,
        autoEmailReports: false
      },
      security: {
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSymbols: false,
        sessionTimeout: 30,
        twoFactorAuth: false,
        loginAttempts: 5,
        accountLockout: 15,
        ipWhitelist: '',
        auditLogging: true
      },
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        leaveNotifications: true,
        attendanceNotifications: true,
        payrollNotifications: true,
        performanceNotifications: true,
        systemNotifications: true
      },
      integrations: {
        googleCalendar: false,
        googleCalendarApiKey: '',
        slackIntegration: false,
        slackWebhookUrl: '',
        zoomIntegration: false,
        zoomApiKey: '',
        zoomApiSecret: '',
        ldapIntegration: false,
        ldapServer: '',
        ldapPort: 389
      }
    };

    res.json({
      success: true,
      settings: defaultSettings
    });
  } else {
    res.json({
      success: true,
      settings: settings.settings || {}
    });
  }
}));

// Update settings
router.put('/:category', [
  authenticate,
  requireRole('ADMIN'),
  authorize('settings:write'),
  body('settings').isObject().withMessage('Settings must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { category } = req.params;
  const { settings } = req.body;

  // Validate category
  const validCategories = ['general', 'company', 'email', 'security', 'notifications', 'integrations'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid settings category'
    });
  }

  // Validate settings based on category
  const validationResult = validateSettingsByCategory(category, settings);
  if (!validationResult.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid settings',
      errors: validationResult.errors
    });
  }

  // Get existing settings
  let existingSettings = await database.findOne('system_settings', {});
  
  if (!existingSettings) {
    // Create new settings document
    existingSettings = {
      settings: {},
      createdAt: new Date(),
      createdBy: req.user.id
    };
  }

  // Update the specific category
  existingSettings.settings[category] = {
    ...existingSettings.settings[category],
    ...settings
  };

  existingSettings.updatedAt = new Date();
  existingSettings.updatedBy = req.user.id;

  if (existingSettings._id) {
    await database.updateOne(
      'system_settings',
      { _id: existingSettings._id },
      { $set: existingSettings }
    );
  } else {
    await database.insertOne('system_settings', existingSettings);
  }

  res.json({
    success: true,
    message: 'Settings updated successfully'
  });
}));

// Validate settings by category
function validateSettingsByCategory(category, settings) {
  const errors = [];

  switch (category) {
    case 'general':
      if (settings.systemName && typeof settings.systemName !== 'string') {
        errors.push('System name must be a string');
      }
      if (settings.timezone && typeof settings.timezone !== 'string') {
        errors.push('Timezone must be a string');
      }
      if (settings.dateFormat && !['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].includes(settings.dateFormat)) {
        errors.push('Invalid date format');
      }
      if (settings.timeFormat && !['12', '24'].includes(settings.timeFormat)) {
        errors.push('Invalid time format');
      }
      if (settings.language && typeof settings.language !== 'string') {
        errors.push('Language must be a string');
      }
      if (settings.currency && typeof settings.currency !== 'string') {
        errors.push('Currency must be a string');
      }
      if (settings.workingDays && !Array.isArray(settings.workingDays)) {
        errors.push('Working days must be an array');
      }
      if (settings.workingHours && typeof settings.workingHours !== 'object') {
        errors.push('Working hours must be an object');
      }
      break;

    case 'company':
      if (settings.companyName && typeof settings.companyName !== 'string') {
        errors.push('Company name must be a string');
      }
      if (settings.companyEmail && !isValidEmail(settings.companyEmail)) {
        errors.push('Invalid company email');
      }
      if (settings.companyWebsite && !isValidUrl(settings.companyWebsite)) {
        errors.push('Invalid company website URL');
      }
      if (settings.foundedYear && (isNaN(settings.foundedYear) || settings.foundedYear < 1800 || settings.foundedYear > new Date().getFullYear())) {
        errors.push('Invalid founded year');
      }
      break;

    case 'email':
      if (settings.smtpHost && typeof settings.smtpHost !== 'string') {
        errors.push('SMTP host must be a string');
      }
      if (settings.smtpPort && (isNaN(settings.smtpPort) || settings.smtpPort < 1 || settings.smtpPort > 65535)) {
        errors.push('Invalid SMTP port');
      }
      if (settings.fromEmail && !isValidEmail(settings.fromEmail)) {
        errors.push('Invalid from email');
      }
      if (settings.smtpSecure && typeof settings.smtpSecure !== 'boolean') {
        errors.push('SMTP secure must be a boolean');
      }
      break;

    case 'security':
      if (settings.passwordMinLength && (isNaN(settings.passwordMinLength) || settings.passwordMinLength < 6 || settings.passwordMinLength > 32)) {
        errors.push('Password minimum length must be between 6 and 32');
      }
      if (settings.sessionTimeout && (isNaN(settings.sessionTimeout) || settings.sessionTimeout < 5 || settings.sessionTimeout > 480)) {
        errors.push('Session timeout must be between 5 and 480 minutes');
      }
      if (settings.loginAttempts && (isNaN(settings.loginAttempts) || settings.loginAttempts < 3 || settings.loginAttempts > 10)) {
        errors.push('Login attempts must be between 3 and 10');
      }
      if (settings.accountLockout && (isNaN(settings.accountLockout) || settings.accountLockout < 5 || settings.accountLockout > 60)) {
        errors.push('Account lockout must be between 5 and 60 minutes');
      }
      break;

    case 'notifications':
      // All notification settings should be boolean
      const notificationKeys = Object.keys(settings);
      for (const key of notificationKeys) {
        if (typeof settings[key] !== 'boolean') {
          errors.push(`${key} must be a boolean`);
        }
      }
      break;

    case 'integrations':
      if (settings.googleCalendarApiKey && typeof settings.googleCalendarApiKey !== 'string') {
        errors.push('Google Calendar API key must be a string');
      }
      if (settings.slackWebhookUrl && !isValidUrl(settings.slackWebhookUrl)) {
        errors.push('Invalid Slack webhook URL');
      }
      if (settings.zoomApiKey && typeof settings.zoomApiKey !== 'string') {
        errors.push('Zoom API key must be a string');
      }
      if (settings.zoomApiSecret && typeof settings.zoomApiSecret !== 'string') {
        errors.push('Zoom API secret must be a string');
      }
      if (settings.ldapServer && typeof settings.ldapServer !== 'string') {
        errors.push('LDAP server must be a string');
      }
      if (settings.ldapPort && (isNaN(settings.ldapPort) || settings.ldapPort < 1 || settings.ldapPort > 65535)) {
        errors.push('Invalid LDAP port');
      }
      break;

    default:
      errors.push('Invalid settings category');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Helper functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Get specific setting category
router.get('/:category', [
  authenticate,
  requireRole('ADMIN'),
  authorize('settings:read')
], asyncHandler(async (req, res) => {
  const { category } = req.params;

  const validCategories = ['general', 'company', 'email', 'security', 'notifications', 'integrations'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid settings category'
    });
  }

  const settings = await database.findOne('system_settings', {});
  
  if (!settings || !settings.settings || !settings.settings[category]) {
    return res.status(404).json({
      success: false,
      message: 'Settings not found'
    });
  }

  res.json({
    success: true,
    settings: settings.settings[category]
  });
}));

// Reset settings to default
router.post('/reset/:category', [
  authenticate,
  requireRole('ADMIN'),
  authorize('settings:write')
], asyncHandler(async (req, res) => {
  const { category } = req.params;

  const validCategories = ['general', 'company', 'email', 'security', 'notifications', 'integrations'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid settings category'
    });
  }

  const defaultSettings = {
    general: {
      systemName: 'FWC HRMS',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12',
      language: 'en',
      currency: 'USD',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      workingHours: { start: '09:00', end: '17:00' }
    },
    company: {
      companyName: '',
      companyAddress: '',
      companyPhone: '',
      companyEmail: '',
      companyWebsite: '',
      taxId: '',
      registrationNumber: '',
      industry: '',
      companySize: '',
      foundedYear: ''
    },
    email: {
      smtpHost: '',
      smtpPort: 587,
      smtpUsername: '',
      smtpPassword: '',
      smtpSecure: false,
      fromEmail: '',
      fromName: '',
      emailNotifications: true,
      autoEmailReports: false
    },
    security: {
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: false,
      sessionTimeout: 30,
      twoFactorAuth: false,
      loginAttempts: 5,
      accountLockout: 15,
      ipWhitelist: '',
      auditLogging: true
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      leaveNotifications: true,
      attendanceNotifications: true,
      payrollNotifications: true,
      performanceNotifications: true,
      systemNotifications: true
    },
    integrations: {
      googleCalendar: false,
      googleCalendarApiKey: '',
      slackIntegration: false,
      slackWebhookUrl: '',
      zoomIntegration: false,
      zoomApiKey: '',
      zoomApiSecret: '',
      ldapIntegration: false,
      ldapServer: '',
      ldapPort: 389
    }
  };

  // Get existing settings
  let existingSettings = await database.findOne('system_settings', {});
  
  if (!existingSettings) {
    existingSettings = {
      settings: {},
      createdAt: new Date(),
      createdBy: req.user.id
    };
  }

  // Reset the specific category to default
  existingSettings.settings[category] = defaultSettings[category];
  existingSettings.updatedAt = new Date();
  existingSettings.updatedBy = req.user.id;

  if (existingSettings._id) {
    await database.updateOne(
      'system_settings',
      { _id: existingSettings._id },
      { $set: existingSettings }
    );
  } else {
    await database.insertOne('system_settings', existingSettings);
  }

  res.json({
    success: true,
    message: `${category} settings reset to default`
  });
}));

// Export settings
router.get('/export/:category', [
  authenticate,
  requireRole('ADMIN'),
  authorize('settings:read')
], asyncHandler(async (req, res) => {
  const { category } = req.params;

  const validCategories = ['general', 'company', 'email', 'security', 'notifications', 'integrations'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid settings category'
    });
  }

  const settings = await database.findOne('system_settings', {});
  
  if (!settings || !settings.settings || !settings.settings[category]) {
    return res.status(404).json({
      success: false,
      message: 'Settings not found'
    });
  }

  const exportData = {
    category,
    settings: settings.settings[category],
    exportedAt: new Date(),
    exportedBy: req.user.id
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${category}_settings_${new Date().toISOString().split('T')[0]}.json"`);
  res.json(exportData);
}));

// Import settings
router.post('/import/:category', [
  authenticate,
  requireRole('ADMIN'),
  authorize('settings:write'),
  body('settings').isObject().withMessage('Settings must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }

  const { category } = req.params;
  const { settings } = req.body;

  const validCategories = ['general', 'company', 'email', 'security', 'notifications', 'integrations'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid settings category'
    });
  }

  // Validate imported settings
  const validationResult = validateSettingsByCategory(category, settings);
  if (!validationResult.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid settings',
      errors: validationResult.errors
    });
  }

  // Get existing settings
  let existingSettings = await database.findOne('system_settings', {});
  
  if (!existingSettings) {
    existingSettings = {
      settings: {},
      createdAt: new Date(),
      createdBy: req.user.id
    };
  }

  // Import the settings
  existingSettings.settings[category] = settings;
  existingSettings.updatedAt = new Date();
  existingSettings.updatedBy = req.user.id;

  if (existingSettings._id) {
    await database.updateOne(
      'system_settings',
      { _id: existingSettings._id },
      { $set: existingSettings }
    );
  } else {
    await database.insertOne('system_settings', existingSettings);
  }

  res.json({
    success: true,
    message: `${category} settings imported successfully`
  });
}));

module.exports = router;