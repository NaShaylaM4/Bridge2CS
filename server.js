// =============================================================================
// WSSU Bridge Recruitment - Backend Server with SQLite
// Express.js + SQLite3 for student application management
// =============================================================================
require('dotenv').config();
const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('./emailService');

const fs = require('fs');
const { execFile } = require('child_process');
const multer = require('multer');

// =============================================================================
// Configuration
// =============================================================================

const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = path.join(__dirname, 'bridge-recruitment.db');
const SALT_ROUNDS = 10;

// =============================================================================
// R Analysis Configuration
// =============================================================================

const upload = multer({ dest: path.join(__dirname, 'uploads') });
const R_SCRIPT_PATH = path.join(__dirname, 'nc_analysis.R');
const R_OUTPUT_DIR = path.join(__dirname, 'output');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const RSCRIPT_BIN = process.env.RSCRIPT_BIN || 'C:\\Program Files\\R\\R-4.5.1\\bin\\Rscript.exe';

async function sendReminderEmail(applicant) {
  const stageLabel = applicant.stage || 'submitted';
  const studentName = applicant.name || 'Student';
  const subject = `Bridge Application Reminder - ${stageLabel}`;
  const text = `Hi ${studentName},\n\nThis is a reminder about your Bridge application. Your current stage is: ${stageLabel}.\n\nPlease log in to review your status and complete any next steps.\n\nWSSU Pre-College STEM Bridge Program`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #b20710;">Application Reminder</h2>
      <p>Hi ${studentName},</p>
      <p>This is a reminder about your Bridge application.</p>
      <p><strong>Current stage:</strong> ${stageLabel}</p>
      <p>Please log in to review your status and complete any next steps.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
      <p style="color: #888; font-size: 0.85rem;">WSSU Pre-College STEM Bridge Program</p>
    </div>
  `;

  await sendEmail(applicant.email, subject, text, html);
}

async function sendIncompleteReminderEmail(applicant) {
  const studentName = applicant.name || 'Student';
  const subject = 'Complete Your Bridge2CS Application';
  const text = `Hi ${studentName},\n\nThis is a friendly reminder to complete your Bridge2CS application for Winston-Salem State University.\n\nCompleting your application helps you access mentorship, STEM career exploration, scholarship guidance, and community support opportunities.\n\nWe are excited to support your next step.\n\nWSSU Pre-College STEM Bridge Program`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #b20710;">Complete Your Bridge2CS Application</h2>
      <p>Hi ${studentName},</p>
      <p>This is a friendly reminder to complete your Bridge2CS application for Winston-Salem State University.</p>
      <p>Completing your application helps you access mentorship, STEM career exploration, scholarship guidance, and community support opportunities.</p>
      <p>We are excited to support your next step.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
      <p style="color: #888; font-size: 0.85rem;">WSSU Pre-College STEM Bridge Program</p>
    </div>
  `;

  // sendEmail uses process.env.EMAIL_FROM as the sender in emailService.js
  await sendEmail(applicant.email, subject, text, html);
}

async function sendSubmissionConfirmationEmail(applicant) {
  const studentName = applicant.name || 'Student';
  const subject = 'Bridge2CS Application Submitted Successfully';
  const text = `Hi ${studentName},\n\nYour Bridge2CS application to Winston-Salem State University was submitted successfully.\n\nThank you for applying. Our team may send future updates to this email address as your application moves forward.\n\nIf you have questions, please contact the Bridge2CS team and we will be glad to help.\n\nWSSU Pre-College STEM Bridge Program`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #b20710;">Application Submitted Successfully</h2>
      <p>Hi ${studentName},</p>
      <p>Your Bridge2CS application to Winston-Salem State University was submitted successfully.</p>
      <p>Thank you for applying. Our team may send future updates to this email address as your application moves forward.</p>
      <p>If you have questions, please contact the Bridge2CS team and we will be glad to help.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
      <p style="color: #888; font-size: 0.85rem;">WSSU Pre-College STEM Bridge Program</p>
    </div>
  `;

  await sendEmail(applicant.email, subject, text, html);
}

async function sendVerificationCodeEmail(email, code) {
  const subject = 'Your Verification Code';
  const text = `Your WSSU Bridge verification code is: ${code}\n\nEnter this code on the portal to confirm your email address.\n\nIf you did not request this, you can ignore this message.\n\nWSSU Pre-College STEM Bridge Program`;
  const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #b20710;">WSSU Bridge Program</h2>
        <p>Hello,</p>
        <p>Your email verification code is:</p>
        <div style="font-size: 2rem; font-weight: bold; letter-spacing: 8px; color: #b20710; text-align: center; padding: 16px 0;">
          ${code}
        </div>
        <p>Enter this code on the portal to confirm your email address.</p>
        <p style="color: #555; font-size: 0.9rem;">If you did not request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
        <p style="color: #888; font-size: 0.8rem;">WSSU Pre-College STEM Bridge Program</p>
      </div>
    `;

  await sendEmail(email, subject, text, html);
}

async function sendAdminPasswordResetEmail(username, email, resetCode) {
  const subject = 'WSSU Bridge Admin Password Reset';
  const text = `Hello ${username},\n\nA password reset was requested for your admin account.\n\nYour reset code is: ${resetCode}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.\n\nWSSU Bridge Admin Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #b20710;">Admin Password Reset</h2>
      <p>Hello ${username},</p>
      <p>A password reset was requested for your admin account.</p>
      <p><strong>Your reset code is:</strong></p>
      <div style="font-size: 2rem; font-weight: bold; letter-spacing: 8px; color: #b20710; text-align: center; padding: 12px 0 16px;">
        ${resetCode}
      </div>
      <p>This code expires in <strong>15 minutes</strong>.</p>
      <p>If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
      <p style="color: #888; font-size: 0.85rem;">WSSU Bridge Admin Team</p>
    </div>
  `;

  await sendEmail(email, subject, text, html);
}

async function sendStageUpdateEmail(applicant, newStage) {
  const studentName = applicant.name || 'Student';

  const stageContent = {
    submitted: {
      subject: 'WSSU Bridge Application Status: Submitted',
      headline: 'Your application is now submitted',
      message: 'We received your application successfully.'
    },
    'under-review': {
      subject: 'WSSU Bridge Application Status: Under Review',
      headline: 'Your application is now under review',
      message: 'Our team is reviewing your application details now.'
    },
    accepted: {
      subject: 'WSSU Bridge Application Status: Accepted',
      headline: 'Congratulations! Your application has been accepted',
      message: 'You have been accepted into Bridge2CS at Winston-Salem State University. Our team will follow up soon with next steps, so please continue monitoring your email for important updates.'
    },
    enrolled: {
      subject: 'WSSU Bridge Application Status: Enrolled',
      headline: 'Welcome! You are officially enrolled',
      message: 'You are now officially enrolled in Bridge2CS at Winston-Salem State University. Our team will send additional onboarding and program details soon, so please watch your email for upcoming updates.'
    }
  };

  const content = stageContent[newStage];
  if (!content) {
    return;
  }

  const text = `Hi ${studentName},\n\n${content.headline}.\n${content.message}\n\nCurrent stage: ${newStage}\n\nIf you have any questions, please feel free to contact our team for assistance.\n\nWSSU Pre-College STEM Bridge Program`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #b20710;">WSSU Bridge Application Status Update</h2>
      <p>Hi ${studentName},</p>
      <p><strong>${content.headline}</strong></p>
      <p>${content.message}</p>
      <p><strong>Current stage:</strong> ${newStage}</p>
      <p>If you have any questions, please feel free to contact our team for assistance.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
      <p style="color: #888; font-size: 0.85rem;">WSSU Pre-College STEM Bridge Program</p>
    </div>
  `;

  await sendEmail(applicant.email, content.subject, text, html);
}

async function sendCampaignEmail(applicant, campaignName, campaignMessage) {
  const studentName = applicant.name || 'Student';
  const subject = `WSSU Bridge Campaign: ${campaignName}`;
  const text = `Hi ${studentName},\n\n${campaignMessage}\n\nCampaign: ${campaignName}\n\nWSSU Pre-College STEM Bridge Program`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #b20710;">WSSU Bridge Campaign Update</h2>
      <p>Hi ${studentName},</p>
      <p>${campaignMessage}</p>
      <p><strong>Campaign:</strong> ${campaignName}</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
      <p style="color: #888; font-size: 0.85rem;">WSSU Pre-College STEM Bridge Program</p>
    </div>
  `;

  await sendEmail(applicant.email, subject, text, html);
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// Frontend page routes (Render production + local direct navigation)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// =============================================================================
// Database Initialization
// =============================================================================

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Write-ahead logging for better concurrency

function initializeDatabase() {
  // Create applicants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS applicants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      school TEXT,
      zip TEXT,
      grad_year INTEGER,
      first_gen TEXT,
      interests TEXT,
      note TEXT,
      eligible INTEGER DEFAULT 1,
      application_status TEXT DEFAULT 'submitted',
      stage TEXT DEFAULT 'submitted',
      reminder_sent INTEGER DEFAULT 0,
      last_reminder_sent TEXT,
      verification_code TEXT,
      verified INTEGER DEFAULT 0,
      submitted_at TEXT,
      updated_at TEXT
    )
  `);

  // Safe migration for existing databases: add reminder timestamp column if missing.
  const applicantColumns = db.prepare('PRAGMA table_info(applicants)').all().map(col => col.name);
  if (!applicantColumns.includes('last_reminder_sent')) {
    db.exec('ALTER TABLE applicants ADD COLUMN last_reminder_sent TEXT');
    console.log('✓ Added applicants.last_reminder_sent column');
  }

  // Create engagement table (single row for global metrics)
  db.exec(`
    CREATE TABLE IF NOT EXISTS engagement (
      id INTEGER PRIMARY KEY,
      email_sent INTEGER DEFAULT 0,
      email_open INTEGER DEFAULT 0,
      email_click INTEGER DEFAULT 0,
      sms_sent INTEGER DEFAULT 0,
      form_started INTEGER DEFAULT 0,
      form_submissions INTEGER DEFAULT 0,
      zip_checks INTEGER DEFAULT 0
    )
  `);

  // Create stage_requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stage_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_id INTEGER,
      requested_stage TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT,
      FOREIGN KEY(applicant_id) REFERENCES applicants(id)
    )
  `);

  // Create admin_users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  const adminColumns = db.prepare('PRAGMA table_info(admin_users)').all().map(col => col.name);
  if (!adminColumns.includes('email')) {
    db.exec('ALTER TABLE admin_users ADD COLUMN email TEXT');
    console.log('✓ Added admin_users.email column');
  }
  if (!adminColumns.includes('reset_code')) {
    db.exec('ALTER TABLE admin_users ADD COLUMN reset_code TEXT');
    console.log('✓ Added admin_users.reset_code column');
  }
  if (!adminColumns.includes('reset_code_expires')) {
    db.exec('ALTER TABLE admin_users ADD COLUMN reset_code_expires TEXT');
    console.log('✓ Added admin_users.reset_code_expires column');
  }

  // Seed default admin user if not exists
  const adminCheck = db.prepare('SELECT * FROM admin_users WHERE username = ?').get('admin');
  if (!adminCheck) {
    const hashedPassword = bcrypt.hashSync('bridge123', SALT_ROUNDS);
    db.prepare('INSERT INTO admin_users (username, password) VALUES (?, ?)').run('admin', hashedPassword);
    console.log('✓ Default admin user created (admin/bridge123)');
  }

  // Ensure engagement metrics row exists
  const engCheck = db.prepare('SELECT * FROM engagement WHERE id = 1').get();
  if (!engCheck) {
    db.prepare('INSERT INTO engagement (id) VALUES (1)').run();
    console.log('✓ Engagement metrics initialized');
  }

  console.log('✓ Database initialized at', DB_PATH);
}

// Initialize on startup
initializeDatabase();

// Ensure uploads and output directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(R_OUTPUT_DIR)) {
  fs.mkdirSync(R_OUTPUT_DIR, { recursive: true });
}

// =============================================================================
// Helper Functions
// =============================================================================

function getEngagementMetrics() {
  const metrics = db.prepare('SELECT * FROM engagement WHERE id = 1').get();
  return metrics || {};
}

function incrementEngagementCounter(action, amount = 1) {
  const validActions = {
    'emailSent': 'email_sent',
    'emailOpen': 'email_open',
    'emailClick': 'email_click',
    'smsSent': 'sms_sent',
    'formStarted': 'form_started',
    'formSubmissions': 'form_submissions',
    'zipCheck': 'zip_checks'
  };

  const column = validActions[action];
  if (!column) {
    console.warn(`Unknown engagement action: ${action}`);
    return;
  }

  const safeAmount = Number.isInteger(amount) && amount > 0 ? amount : 1;
  db.prepare(`UPDATE engagement SET ${column} = ${column} + ? WHERE id = 1`).run(safeAmount);
}

function normalizeInterestList(rawInterests) {
  if (!rawInterests) return [];

  if (Array.isArray(rawInterests)) {
    return rawInterests;
  }

  if (typeof rawInterests === 'string') {
    try {
      const parsed = JSON.parse(rawInterests);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  return [];
}

function isHashedPassword(password) {
  return typeof password === 'string' && password.startsWith('$2');
}

function calculateMetrics() {
  const allApplicants = db.prepare('SELECT * FROM applicants').all();
  const metrics = getEngagementMetrics();

  // Count each applicant once per selected interest area.
  const trackedInterests = [
    'Computer Science',
    'Information Technology',
    'AI/ML',
    'Data Science',
    'Engineering',
    'Mathematics',
    'Robotics'
  ];

  const interestCounts = trackedInterests.reduce((acc, label) => {
    acc[label] = 0;
    return acc;
  }, {});

  allApplicants.forEach(applicant => {
    const selectedInterests = new Set(normalizeInterestList(applicant.interests));
    trackedInterests.forEach(interest => {
      if (selectedInterests.has(interest)) {
        interestCounts[interest] += 1;
      }
    });
  });

  const eligible = allApplicants.filter(a => a.eligible === 1).length;
  const firstGen = allApplicants.filter(a => a.first_gen === 'yes').length;
  const incompleteCount = allApplicants.filter(a => a.application_status === 'incomplete').length;
  const completion = allApplicants.length > 0 
    ? ((metrics.form_submissions || 0) / allApplicants.length * 100).toFixed(2)
    : 0;

  const stageCounts = {
    submitted: allApplicants.filter(a => a.stage === 'submitted').length,
    underReview: allApplicants.filter(a => a.stage === 'under-review').length,
    accepted: allApplicants.filter(a => a.stage === 'accepted').length,
    enrolled: allApplicants.filter(a => a.stage === 'enrolled').length
  };

  // Cumulative funnel counts (stage reached or beyond).
  // This models a real progression pipeline and avoids misleading 0% transitions
  // when later-stage applicants exist but an intermediate current-stage count is 0.
  const funnelCounts = {
    submitted: allApplicants.length,
    underReview: allApplicants.filter(a => ['under-review', 'accepted', 'enrolled'].includes(a.stage)).length,
    accepted: allApplicants.filter(a => ['accepted', 'enrolled'].includes(a.stage)).length,
    enrolled: allApplicants.filter(a => a.stage === 'enrolled').length
  };

  return {
    totalApplicants: allApplicants.length,
    eligibleApplicants: eligible,
    firstGenApplicants: firstGen,
    incompleteCount,
    completionRate: parseFloat(completion),
    formSubmissions: metrics.form_submissions || 0,
    emailSent: metrics.email_sent || 0,
    emailOpen: metrics.email_open || 0,
    emailClick: metrics.email_click || 0,
    smsSent: metrics.sms_sent || 0,
    zipChecks: metrics.zip_checks || 0,
    stageCounts,
    funnelCounts,
    interestCounts
  };
}

// =============================================================================
// In-Memory Session Management (Simple for class project - use Redis in production)
// =============================================================================

const adminSessions = new Map(); // token -> { username, id, expiresAt }

// Simple session cleanup (in production, use proper session management)
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of adminSessions.entries()) {
    if (session.expiresAt < now) {
      adminSessions.delete(token);
    }
  }
}, 60000); // Clean up every minute

// Middleware to check admin authentication
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const session = adminSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Extend session on activity
  session.expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  req.adminSession = session;
  next();
}

// Middleware to check admin authentication (Bearer or query token)
function requireAdminAuthOrQueryToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const session = adminSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Extend session on activity
  session.expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  req.adminSession = session;
  next();
}

// =============================================================================
// Routes - Authentication & Admin Management
// =============================================================================

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';

  if (!normalizedUsername || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }

  const admin = db.prepare('SELECT * FROM admin_users WHERE LOWER(username) = ?').get(normalizedUsername);

  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Migration-safe password check:
  // 1. Use bcrypt for already-hashed passwords.
  // 2. If an older plaintext password still exists and matches,
  //    allow login once and immediately replace it with a hash.
  let passwordMatches = false;

  if (isHashedPassword(admin.password)) {
    passwordMatches = await bcrypt.compare(password, admin.password);
  } else if (admin.password === password) {
    passwordMatches = true;

    // Migration-safe upgrade: convert old plaintext password to bcrypt hash
    // immediately after a successful plaintext login.
    const upgradedHash = await bcrypt.hash(password, SALT_ROUNDS);
    db.prepare('UPDATE admin_users SET password = ? WHERE id = ?').run(upgradedHash, admin.id);
  }

  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Create session token (simple for class project - use JWT in production)
  const token = `admin-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const session = {
    id: admin.id,
    username: admin.username,
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };

  adminSessions.set(token, session);

  res.json({
    success: true,
    token: token,
    username: admin.username
  });
});

app.post('/api/admin-forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';

    if (!normalizedUsername) {
      return res.json({
        success: true,
        message: 'If that account exists, a reset email has been sent.'
      });
    }

    const admin = db.prepare('SELECT * FROM admin_users WHERE LOWER(username) = ?').get(normalizedUsername);

    if (admin) {
      const resetCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      db.prepare('UPDATE admin_users SET reset_code = ?, reset_code_expires = ? WHERE id = ?').run(
        resetCode,
        expiresAt,
        admin.id
      );

      const resetRecipient = typeof admin.email === 'string' ? admin.email.trim().toLowerCase() : '';

      if (resetRecipient) {
        try {
          await sendAdminPasswordResetEmail(admin.username, resetRecipient, resetCode);
        } catch (emailError) {
          console.error('Admin reset email failed:', emailError);
        }
      } else {
        console.warn(`Admin reset email skipped: no email set for admin "${admin.username}".`);
      }
    }

    return res.json({
      success: true,
      message: 'If that account exists, a reset email has been sent.'
    });
  } catch (error) {
    console.error('POST /api/admin-forgot-password error:', error);
    return res.json({
      success: true,
      message: 'If that account exists, a reset email has been sent.'
    });
  }
});

app.post('/api/admin-reset-password', async (req, res) => {
  try {
    const { username, resetCode, newPassword } = req.body;
    const normalizedUsername = typeof username === 'string' ? username.trim().toLowerCase() : '';
    const normalizedResetCode = typeof resetCode === 'string' ? resetCode.trim() : '';
    const normalizedNewPassword = typeof newPassword === 'string' ? newPassword : '';

    if (!normalizedUsername || !normalizedResetCode || !normalizedNewPassword) {
      return res.status(400).json({ error: 'Missing username, reset code, or new password' });
    }

    if (normalizedNewPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const admin = db.prepare('SELECT * FROM admin_users WHERE LOWER(username) = ?').get(normalizedUsername);
    if (!admin) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    const hasValidCode =
      typeof admin.reset_code === 'string' &&
      admin.reset_code.length > 0 &&
      admin.reset_code === normalizedResetCode;

    const hasValidExpiry =
      typeof admin.reset_code_expires === 'string' &&
      admin.reset_code_expires.length > 0 &&
      Date.parse(admin.reset_code_expires) > Date.now();

    if (!hasValidCode || !hasValidExpiry) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    const hashedPassword = await bcrypt.hash(normalizedNewPassword, SALT_ROUNDS);
    db.prepare(`
      UPDATE admin_users
      SET password = ?,
          reset_code = NULL,
          reset_code_expires = NULL
      WHERE id = ?
    `).run(hashedPassword, admin.id);

    for (const [token, session] of adminSessions.entries()) {
      if (session.id === admin.id) {
        adminSessions.delete(token);
      }
    }

    return res.json({ success: true, message: 'Password reset successful. Please log in with your new password.' });
  } catch (error) {
    console.error('POST /api/admin-reset-password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// GET /api/admin-session - Check if current session is valid
app.get('/api/admin-session', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const session = adminSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Extend session on check
  session.expiresAt = Date.now() + (24 * 60 * 60 * 1000);

  res.json({
    success: true,
    username: session.username
  });
});

// POST /api/logout - Clear admin session
app.post('/api/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token) {
    adminSessions.delete(token);
  }

  res.json({ success: true });
});

// GET /api/admin-users - List all admin users (ID and username only, no passwords)
app.get('/api/admin-users', requireAdminAuth, (req, res) => {
  try {
    const admins = db.prepare('SELECT id, username, email FROM admin_users ORDER BY id ASC').all();
    res.json(admins);
  } catch (error) {
    console.error('GET /api/admin-users error:', error);
    res.status(500).json({ error: 'Failed to fetch admin users' });
  }
});

// POST /api/admin-users - Create new admin user
app.post('/api/admin-users', requireAdminAuth, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedUsername || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Missing username, email, or password' });
    }

    if (normalizedUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (password.length < 5) {
      return res.status(400).json({ error: 'Password must be at least 5 characters' });
    }

    // Check for duplicate username
    const existing = db.prepare('SELECT id FROM admin_users WHERE LOWER(username) = ?').get(normalizedUsername.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const existingEmail = db.prepare('SELECT id FROM admin_users WHERE LOWER(email) = ?').get(normalizedEmail);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const stmt = db.prepare('INSERT INTO admin_users (username, email, password) VALUES (?, ?, ?)');
    const result = stmt.run(normalizedUsername, normalizedEmail, hashedPassword);

    console.log(`✓ New admin user created: ${normalizedUsername}`);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('POST /api/admin-users error:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

// PUT /api/admin-users/:id - Update admin password
app.put('/api/admin-users/:id', requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { password, email } = req.body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!password && !normalizedEmail) {
      return res.status(400).json({ error: 'Missing password or email' });
    }

    if (password && password.length < 5) {
      return res.status(400).json({ error: 'Password must be at least 5 characters' });
    }

    const admin = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }    

    if (normalizedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please provide a valid email address' });
      }

      const emailTaken = db.prepare('SELECT id FROM admin_users WHERE LOWER(email) = ? AND id != ?').get(normalizedEmail, id);
      if (emailTaken) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    if (password && normalizedEmail) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      db.prepare('UPDATE admin_users SET password = ?, email = ? WHERE id = ?').run(hashedPassword, normalizedEmail, id);
      console.log(`✓ Password and email updated for admin: ${admin.username}`);
    } else if (password) {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      db.prepare('UPDATE admin_users SET password = ? WHERE id = ?').run(hashedPassword, id);
      console.log(`✓ Password updated for admin: ${admin.username}`);
    } else {
      db.prepare('UPDATE admin_users SET email = ? WHERE id = ?').run(normalizedEmail, id);
      console.log(`✓ Email updated for admin: ${admin.username}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('PUT /api/admin-users/:id error:', error);
    res.status(500).json({ error: 'Failed to update admin password' });
  }
});

// DELETE /api/admin-users/:id - Delete admin user
app.delete('/api/admin-users/:id', requireAdminAuth, (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deletion of last admin account
    const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
    if (adminCount.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin account' });
    }

    const admin = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    db.prepare('DELETE FROM admin_users WHERE id = ?').run(id);

    console.log(`✓ Admin user deleted: ${admin.username}`);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin-users/:id error:', error);
    res.status(500).json({ error: 'Failed to delete admin user' });
  }
});

// =============================================================================
// Routes - Applicants
// =============================================================================

app.get('/api/applicants', (req, res) => {
  try {
    const applicants = db
      .prepare('SELECT * FROM applicants ORDER BY submitted_at DESC')
      .all()
      .map(applicant => ({
        ...applicant,
        interests: normalizeInterestList(applicant.interests)
      }));
    res.json(applicants);
  } catch (error) {
    console.error('GET /api/applicants error:', error);
    res.status(500).json({ error: 'Failed to fetch applicants' });
  }
});

app.get('/api/applicants/draft', (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Email query parameter is required' });
    }

    const applicant = db.prepare(`
      SELECT * FROM applicants
      WHERE LOWER(email) = LOWER(?)
      AND (application_status = 'incomplete' OR application_status = 'draft')
      ORDER BY COALESCE(updated_at, submitted_at) DESC
      LIMIT 1
    `).get(email);

    if (!applicant) {
      return res.status(404).json({ error: 'No incomplete application was found for that email.' });
    }

    return res.json({
      id: applicant.id,
      name: applicant.name,
      email: applicant.email,
      phone: applicant.phone,
      school: applicant.school,
      zip: applicant.zip,
      gradYear: applicant.grad_year,
      firstGen: applicant.first_gen,
      interests: normalizeInterestList(applicant.interests),
      note: applicant.note,
      eligible: applicant.eligible,
      applicationStatus: applicant.application_status === 'draft' ? 'incomplete' : applicant.application_status
    });
  } catch (error) {
    console.error('GET /api/applicants/draft error:', error);
    return res.status(500).json({ error: 'Failed to load saved application draft' });
  }
});

app.post('/api/applicants', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      school,
      zip,
      gradYear,
      firstGen,
      interests,
      note,
      eligible,
      applicationStatus,
      stage,
      submittedAt
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Email is the draft key so students can save partial progress and return later.
    // We update existing records by email instead of creating duplicates.
    const normalizedEmail = String(email).trim().toLowerCase();
    const now = new Date().toISOString();
    const existing = db.prepare('SELECT * FROM applicants WHERE email = ?').get(normalizedEmail);

    const normalizedStatus = applicationStatus === 'submitted' ? 'submitted' : 'incomplete';

    const cleanString = (value) => {
      if (typeof value !== 'string') return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const preferIncomingString = (incoming, current) => {
      const cleaned = cleanString(incoming);
      return cleaned !== null ? cleaned : current;
    };

    const normalizeInterestsForStorage = (incoming, currentRaw) => {
      if (Array.isArray(incoming)) {
        return JSON.stringify(incoming);
      }
      return currentRaw || JSON.stringify([]);
    };

    const normalizeEligible = (incoming, current) => {
      if (incoming === true || incoming === 1 || incoming === '1') return 1;
      if (incoming === false || incoming === 0 || incoming === '0') return 0;
      return typeof current === 'number' ? current : 1;
    };

    const normalizeGradYear = (incoming, current) => {
      const parsed = Number.parseInt(incoming, 10);
      if (Number.isFinite(parsed)) return parsed;
      return current ?? null;
    };

    const shouldIncrementSubmissionMetric =
      normalizedStatus === 'submitted' &&
      (!existing || existing.application_status !== 'submitted');

    if (existing) {
      const updatedName = preferIncomingString(name, existing.name);
      const updatedPhone = preferIncomingString(phone, existing.phone);
      const updatedSchool = preferIncomingString(school, existing.school);
      const updatedZip = preferIncomingString(zip, existing.zip);
      const updatedGradYear = normalizeGradYear(gradYear, existing.grad_year);
      const updatedFirstGen = preferIncomingString(firstGen, existing.first_gen);
      const updatedInterests = normalizeInterestsForStorage(interests, existing.interests);
      const updatedNote = preferIncomingString(note, existing.note);
      const updatedEligible = normalizeEligible(eligible, existing.eligible);

      // Keep stage separate from application status, but align defaults by status.
      // Incomplete drafts should not appear as submitted.
      const incomingStage = cleanString(stage);
      const updatedStage = incomingStage || (normalizedStatus === 'incomplete' ? 'incomplete' : 'submitted');

      // Keep initial submitted_at if already set; otherwise set it now.
      const resolvedSubmittedAt = existing.submitted_at || submittedAt || now;

      db.prepare(`
        UPDATE applicants
        SET name = ?,
            email = ?,
            phone = ?,
            school = ?,
            zip = ?,
            grad_year = ?,
            first_gen = ?,
            interests = ?,
            note = ?,
            eligible = ?,
            application_status = ?,
            stage = ?,
            submitted_at = ?,
            updated_at = ?
        WHERE id = ?
      `).run(
        updatedName,
        normalizedEmail,
        updatedPhone,
        updatedSchool,
        updatedZip,
        updatedGradYear,
        updatedFirstGen,
        updatedInterests,
        updatedNote,
        updatedEligible,
        normalizedStatus,
        updatedStage,
        resolvedSubmittedAt,
        now,
        existing.id
      );

      if (shouldIncrementSubmissionMetric) {
        incrementEngagementCounter('formSubmissions');
      }

      let verificationRequired = false;
      let submissionEmailSent = false;

      if (normalizedStatus === 'submitted') {
        const alreadyVerified = Number(existing.verified) === 1;
        verificationRequired = !alreadyVerified;

        try {
          await sendSubmissionConfirmationEmail({
            name: updatedName,
            email: normalizedEmail
          });
          submissionEmailSent = true;
        } catch (emailError) {
          console.error('Submission confirmation email failed:', emailError);
        }

        if (verificationRequired) {
          const code = generateVerificationCode();
          db.prepare('UPDATE applicants SET verification_code = ?, updated_at = ? WHERE id = ?').run(
            code,
            now,
            existing.id
          );

          try {
            await sendVerificationCodeEmail(normalizedEmail, code);
          } catch (verifyEmailError) {
            console.error('Auto verification email failed:', verifyEmailError);
          }
        }
      }

      return res.json({
        success: true,
        id: existing.id,
        applicationStatus: normalizedStatus,
        verificationRequired,
        submissionEmailSent
      });
    }

    const interestsJson = JSON.stringify(Array.isArray(interests) ? interests : []);
    const incomingStage = cleanString(stage);
    const newStage = incomingStage || (normalizedStatus === 'incomplete' ? 'incomplete' : 'submitted');

    const stmt = db.prepare(`
      INSERT INTO applicants (
        name, email, phone, school, zip, grad_year, first_gen, interests,
        note, eligible, application_status, stage, submitted_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      cleanString(name),
      normalizedEmail,
      cleanString(phone),
      cleanString(school),
      cleanString(zip),
      normalizeGradYear(gradYear, null),
      cleanString(firstGen),
      interestsJson,
      cleanString(note),
      normalizeEligible(eligible, 1),
      normalizedStatus,
      newStage,
      submittedAt || now,
      now
    );

    if (shouldIncrementSubmissionMetric) {
      incrementEngagementCounter('formSubmissions');
    }

    let verificationRequired = false;
    let submissionEmailSent = false;

    if (normalizedStatus === 'submitted') {
      verificationRequired = true;

      try {
        await sendSubmissionConfirmationEmail({
          name: cleanString(name),
          email: normalizedEmail
        });
        submissionEmailSent = true;
      } catch (emailError) {
        console.error('Submission confirmation email failed:', emailError);
      }

      const code = generateVerificationCode();
      db.prepare('UPDATE applicants SET verification_code = ?, updated_at = ? WHERE id = ?').run(
        code,
        now,
        result.lastInsertRowid
      );

      try {
        await sendVerificationCodeEmail(normalizedEmail, code);
      } catch (verifyEmailError) {
        console.error('Auto verification email failed:', verifyEmailError);
      }
    }

    res.json({
      success: true,
      id: result.lastInsertRowid,
      applicationStatus: normalizedStatus,
      verificationRequired,
      submissionEmailSent
    });
  } catch (error) {
    console.error('POST /api/applicants error:', error);
    res.status(500).json({ error: 'Failed to save applicant' });
  }
});

app.put('/api/applicants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const applicant = db.prepare('SELECT * FROM applicants WHERE id = ?').get(id);
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const now = new Date().toISOString();
    const updateFields = [];
    const updateValues = [];

    // Dynamically build update query based on provided fields.
    // Supports both admin edits (name, email, etc.) and stage changes + engagement tracking.
    const allowedFields = [
      'name', 'email', 'phone', 'school', 'zip', 'grad_year', 'first_gen', 'interests',
      'note', 'eligible', 'application_status', 'stage', 'verified', 'verification_code',
      'reminder_sent'
    ];
    Object.entries(updates).forEach(([key, value]) => {
      // Convert camelCase to snake_case
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbKey)) {
        updateFields.push(`${dbKey} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      return res.json({ success: true });
    }

    // Capture stage change intent before writing the update.
    // We only send a status email when the stage actually changes.
    const oldStage = applicant.stage;
    const hasStageField = Object.prototype.hasOwnProperty.call(updates, 'stage');
    const newStage = hasStageField ? updates.stage : null;
    const stageChanged = hasStageField && typeof newStage === 'string' && newStage !== oldStage;

    updateFields.push('updated_at = ?');
    updateValues.push(now);
    updateValues.push(id);

    const query = `UPDATE applicants SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(query).run(...updateValues);

    if (stageChanged) {
      // Do not block admin workflow if email fails.
      // The stage update stays saved even if delivery fails.
      const updatedApplicant = { ...applicant, stage: newStage };
      sendStageUpdateEmail(updatedApplicant, newStage).catch((emailError) => {
        console.error(`Stage update email failed for ${updatedApplicant.email}:`, emailError.message);
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('PUT /api/applicants/:id error:', error);
    res.status(500).json({ error: 'Failed to update applicant' });
  }
});

app.delete('/api/applicants/:id', (req, res) => {
  try {
    const { id } = req.params;

    const applicant = db.prepare('SELECT * FROM applicants WHERE id = ?').get(id);
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    // Clean up any related stage requests for this applicant.
    // This prevents orphaned records from cluttering the database.
    db.prepare('DELETE FROM stage_requests WHERE applicant_id = ?').run(id);

    // Delete the applicant record
    db.prepare('DELETE FROM applicants WHERE id = ?').run(id);

    console.log(`Applicant deleted: ${applicant.email} (ID: ${id})`);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/applicants/:id error:', error);
    res.status(500).json({ error: 'Failed to delete applicant' });
  }
});

// =============================================================================
// Routes - Metrics & Engagement
// =============================================================================

app.get('/api/metrics', (req, res) => {
  try {
    const metrics = calculateMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('GET /api/metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

app.post('/api/engagement', (req, res) => {
  try {
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Missing action' });
    }

    incrementEngagementCounter(action);
    res.json({ success: true });
  } catch (error) {
    console.error('POST /api/engagement error:', error);
    res.status(500).json({ error: 'Failed to track engagement' });
  }
});

// =============================================================================
// Routes - Stage Requests
// =============================================================================

app.get('/api/requests', (req, res) => {
  try {
    const requests = db.prepare(`
      SELECT 
        sr.id, 
        sr.applicant_id, 
        sr.requested_stage as stageRequest,
        sr.status,
        a.email,
        a.name,
        a.stage
      FROM stage_requests sr
      JOIN applicants a ON sr.applicant_id = a.id
      WHERE sr.status = 'pending'
      ORDER BY sr.created_at DESC
    `).all();

    res.json(requests);
  } catch (error) {
    console.error('GET /api/requests error:', error);
    res.status(500).json({ error: 'Failed to fetch stage requests' });
  }
});

app.put('/api/requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const request = db.prepare('SELECT * FROM stage_requests WHERE id = ?').get(id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (action === 'approve') {
      // Update applicant stage
      db.prepare('UPDATE applicants SET stage = ?, updated_at = ? WHERE id = ?').run(
        request.requested_stage,
        new Date().toISOString(),
        request.applicant_id
      );
    }

    // Mark request as processed
    db.prepare('UPDATE stage_requests SET status = ? WHERE id = ?').run(action, id);

    res.json({ success: true });
  } catch (error) {
    console.error('PUT /api/requests/:id error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Route to create a stage request from student portal
app.post('/api/requests', (req, res) => {
  try {
    const { email, stageRequest } = req.body;

    if (!email || !stageRequest) {
      return res.status(400).json({ error: 'Missing email or stageRequest' });
    }

    const applicant = db.prepare('SELECT * FROM applicants WHERE email = ?').get(email);
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    const stmt = db.prepare(`
      INSERT INTO stage_requests (applicant_id, requested_stage, created_at)
      VALUES (?, ?, ?)
    `);

    stmt.run(applicant.id, stageRequest, new Date().toISOString());

    res.json({ success: true });
  } catch (error) {
    console.error('POST /api/requests error:', error);
    res.status(500).json({ error: 'Failed to create stage request' });
  }
});

// =============================================================================
// Routes - Email Verification
// =============================================================================

app.post('/api/verification/send', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    const applicant = db.prepare('SELECT * FROM applicants WHERE email = ?').get(email);
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    // Generate 6-digit code
    const code = generateVerificationCode();

    await sendVerificationCodeEmail(email, code);
    db.prepare('UPDATE applicants SET verification_code = ? WHERE id = ?').run(code, applicant.id);

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('POST /api/verification/send error:', error);
    res.status(500).json({ success: false, error: 'Failed to send verification email' });
  }
});

app.post('/api/verification/confirm', (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Missing email or code' });
    }

    const applicant = db.prepare('SELECT * FROM applicants WHERE email = ?').get(email);
    if (!applicant || applicant.verification_code !== code) {
      return res.status(401).json({ error: 'Invalid code' });
    }

    // Mark as verified
    db.prepare('UPDATE applicants SET verified = 1, updated_at = ? WHERE id = ?').run(
      new Date().toISOString(),
      applicant.id
    );

    res.json({ success: true });
  } catch (error) {
    console.error('POST /api/verification/confirm error:', error);
    res.status(500).json({ error: 'Failed to confirm verification' });
  }
});

// =============================================================================
// Routes - Reminders & Campaigns
// =============================================================================

app.post('/api/reminders/run', async (req, res) => {
  try {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60000).toISOString();

    // Find pending applicants who haven't received reminder
    const pending = db.prepare(`
      SELECT * FROM applicants
      WHERE (stage = 'submitted' OR stage = 'under-review')
      AND reminder_sent = 0
      AND submitted_at < ?
    `).all(twoMinutesAgo);

    let successful = 0;
    const failures = [];

    // Process reminders one-by-one so we can track exactly what succeeded or failed.
    for (const applicant of pending) {
      try {
        await sendReminderEmail(applicant);

        // Only mark reminder as sent when email delivery succeeds.
        db.prepare('UPDATE applicants SET reminder_sent = 1, updated_at = ? WHERE id = ?').run(
          now.toISOString(),
          applicant.id
        );

        successful += 1;
      } catch (emailError) {
        failures.push({
          id: applicant.id,
          email: applicant.email,
          message: emailError?.message || 'Unknown email error'
        });
      }
    }

    if (successful > 0) {
      // Increase emailSent by the real number of successful reminder sends.
      incrementEngagementCounter('emailSent', successful);
    }

    if (failures.length > 0) {
      return res.status(207).json({
        success: false,
        partial: true,
        attempted: pending.length,
        successCount: successful,
        failedCount: failures.length,
        failures
      });
    }

    res.json({ success: true, attempted: pending.length, count: successful });
  } catch (error) {
    console.error('POST /api/reminders/run error:', error);
    res.status(500).json({ error: error.message || 'Failed to run reminders' });
  }
});

app.post('/api/reminders/incomplete', async (req, res) => {
  try {
    console.log('INCOMPLETE REMINDER ROUTE HIT');

    const incompleteApplicants = db.prepare(`
      SELECT * FROM applicants
      WHERE (
        application_status = 'incomplete'
        OR stage = 'incomplete'
      )
      AND email IS NOT NULL
      AND email != ''
    `).all();

    console.log('Incomplete applicants found:', incompleteApplicants.length);

    // Optional safety: avoid duplicate reminders to the same email in one run.
    const seenEmails = new Set();
    const uniqueRecipients = incompleteApplicants.filter(applicant => {
      const normalizedEmail = String(applicant.email || '').trim().toLowerCase();
      if (!normalizedEmail || seenEmails.has(normalizedEmail)) return false;
      seenEmails.add(normalizedEmail);
      return true;
    });

    console.log('Unique recipients found:', uniqueRecipients.length);

    const attempted = uniqueRecipients.length;
    let successCount = 0;
    let failedCount = 0;
    const now = new Date().toISOString();

    // Send sequentially so each success/failure is tracked clearly.
    for (const applicant of uniqueRecipients) {
      try {
        console.log('Attempting reminder for:', applicant.email);
        await sendIncompleteReminderEmail(applicant);

        db.prepare(`
          UPDATE applicants
          SET reminder_sent = 1,
              last_reminder_sent = ?,
              updated_at = ?
          WHERE id = ?
        `).run(now, now, applicant.id);

        successCount += 1;
      } catch (emailError) {
        failedCount += 1;
        console.error(`Incomplete reminder failed for ${applicant.email}:`, emailError.message);
      }
    }

    if (successCount > 0) {
      incrementEngagementCounter('emailSent', successCount);
    }

    res.json({
      success: true,
      attempted,
      successCount,
      failedCount
    });
  } catch (error) {
    console.error('POST /api/reminders/incomplete error:', error);
    res.status(500).json({ error: error.message || 'Failed to send incomplete reminders' });
  }
});

app.post('/api/campaigns/run', async (req, res) => {
  try {
    const { campaign, message } = req.body;

    if (!campaign || !message) {
      return res.status(400).json({ error: 'Missing campaign or message' });
    }

    const applicants = db.prepare('SELECT * FROM applicants WHERE eligible = 1').all();

    let successCount = 0;
    const failures = [];

    // Send campaign emails one-by-one to keep the logic easy to follow.
    // This also lets us return clear partial-success details.
    for (const applicant of applicants) {
      try {
        await sendCampaignEmail(applicant, campaign, message);
        successCount += 1;
      } catch (emailError) {
        console.error(`Campaign email failed for ${applicant.email}:`, emailError.message);
        failures.push({
          id: applicant.id,
          email: applicant.email,
          message: emailError?.message || 'Unknown email error'
        });
      }
    }

    if (successCount > 0) {
      // Increase emailSent by the actual number of successful campaign sends.
      incrementEngagementCounter('emailSent', successCount);
    }

    if (failures.length > 0) {
      return res.status(207).json({
        success: false,
        partial: true,
        totalRecipients: applicants.length,
        successCount,
        failedCount: failures.length,
        failures
      });
    }

    res.json({
      success: true,
      totalRecipients: applicants.length,
      successCount,
      failedCount: 0
    });
  } catch (error) {
    console.error('POST /api/campaigns/run error:', error);
    res.status(500).json({ error: 'Failed to run campaign' });
  }
});

// =============================================================================
// Routes - SendGrid Event Webhook (Open/Click Tracking)
// =============================================================================

app.post('/api/sendgrid/events', (req, res) => {
  try {
    // In production, verify SendGrid's signed webhook headers before processing.
    // Keep this first version simple for class/demo use, but leave this note so
    // signature verification can be added later without changing route behavior.
    // Header examples: X-Twilio-Email-Event-Webhook-Signature and Timestamp.

    const events = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid payload: expected an array of events' });
    }

    let openCount = 0;
    let clickCount = 0;
    let processed = 0;

    // Each webhook call can contain multiple event objects.
    // We only count supported event types and safely ignore everything else.
    events.forEach((eventObj) => {
      if (!eventObj || typeof eventObj !== 'object') {
        return;
      }

      const eventType = typeof eventObj.event === 'string'
        ? eventObj.event.toLowerCase()
        : '';

      if (eventType === 'open') {
        openCount += 1;
        processed += 1;
      } else if (eventType === 'click') {
        clickCount += 1;
        processed += 1;
      }
    });

    if (openCount > 0) {
      incrementEngagementCounter('emailOpen', openCount);
    }

    if (clickCount > 0) {
      incrementEngagementCounter('emailClick', clickCount);
    }

    console.log(`SendGrid events received: ${openCount} open, ${clickCount} click`);

    res.json({
      success: true,
      processed,
      opens: openCount,
      clicks: clickCount
    });
  } catch (error) {
    console.error('POST /api/sendgrid/events error:', error);
    res.status(500).json({ error: 'Failed to process SendGrid events' });
  }
});

// =============================================================================
// Routes - Admin R Analysis
// =============================================================================

app.post('/api/admin-r/upload', requireAdminAuth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (path.extname(req.file.originalname).toLowerCase() !== '.csv') {
      return res.status(400).json({ error: 'Only CSV files are allowed' });
    }

    const targetPath = path.join(UPLOADS_DIR, 'nc_input.csv');
    fs.renameSync(req.file.path, targetPath);

    res.json({ success: true, message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

app.post('/api/admin-r/run', requireAdminAuth, (req, res) => {
  const inputFile = path.join(UPLOADS_DIR, 'nc_input.csv');

  if (!fs.existsSync(inputFile)) {
    return res.status(400).json({ error: 'Input file not found. Please upload a CSV first.' });
  }

  execFile(RSCRIPT_BIN, [R_SCRIPT_PATH, inputFile], { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error('R script error:', error);
      return res.status(500).json({ error: 'R script execution failed', details: error.message });
    }

    const summaryFile = path.join(R_OUTPUT_DIR, 'nc_summary.json');
    const filteredFile = path.join(R_OUTPUT_DIR, 'nc_filtered.csv');

    if (!fs.existsSync(summaryFile) || !fs.existsSync(filteredFile)) {
      return res.status(500).json({ error: 'R script did not produce expected output files' });
    }

    try {
      const summaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
      res.json({ success: true, summary: summaryData });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      res.status(500).json({ error: 'Failed to parse summary data' });
    }
  });
});

app.get('/api/admin-r/results', requireAdminAuth, (req, res) => {
  const summaryFile = path.join(R_OUTPUT_DIR, 'nc_summary.json');

  if (!fs.existsSync(summaryFile)) {
    return res.status(404).json({ error: 'Summary file not found' });
  }

  try {
    const summaryData = JSON.parse(fs.readFileSync(summaryFile, 'utf8'));
    res.json(summaryData);
  } catch (error) {
    console.error('Read summary error:', error);
    res.status(500).json({ error: 'Failed to read summary data' });
  }
});

app.get('/api/admin-r/download/csv', requireAdminAuthOrQueryToken, (req, res) => {
  const filePath = path.join(R_OUTPUT_DIR, 'nc_filtered.csv');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Filtered CSV file not found' });
  }

  res.download(filePath, 'nc_filtered.csv');
});

app.get('/api/admin-r/download/json', requireAdminAuthOrQueryToken, (req, res) => {
  const filePath = path.join(R_OUTPUT_DIR, 'nc_summary.json');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Summary JSON file not found' });
  }

  res.download(filePath, 'nc_summary.json');
});

// =============================================================================
// Health Check
// =============================================================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'WSSU Bridge Server running' });
});

// =============================================================================
// Server Startup
// =============================================================================

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`WSSU Bridge Recruitment Server`);
  console.log(`Running on http://localhost:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Admin: admin / bridge123`);
  console.log(`========================================\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});
