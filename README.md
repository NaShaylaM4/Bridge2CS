# WSSU STEM Bridge Recruitment Platform

A full-stack web application for recruiting first-generation and underrepresented students from Forsyth County, NC into STEM pre-college bridge programs.

## 📋 Overview

The Bridge Recruitment Platform helps administrators manage student recruitment through:
- **Student Portal**: Simple application intake, email verification, and stage tracking
- **Admin Dashboard**: Applicant metrics, filtering, stage workflow management, and campaign tracking  
- **Backend API**: Express.js server with SQLite database for persistent storage
- **Draft Saving**: Students can save incomplete applications and return later

## ✨ Key Features

### Student Portal (index.html)
- ✓ ZIP code eligibility check (Forsyth County only)
- ✓ Simplified 5-field application form
- ✓ Draft saving (incomplete applications)
- ✓ FAFSA-based financial eligibility estimator (class-project only)
- ✓ Student experiences/testimonial cards
- ✓ Email verification with OTP codes
- ✓ Application status tracking
- ✓ Stage update requests (pending admin approval)
- ✓ Progress tracker metrics
- ✓ Engagement tracking (email/SMS simulation)

### Admin Dashboard (admin.html)
- ✓ Simple login (`admin` / `bridge123`)
- ✓ Real-time metrics dashboard
- ✓ Applicant management with inline stage controls
- ✓ Workflow: Submitted → Under Review → Accepted → Enrolled
- ✓ Advanced filtering (name, ZIP, interest)
- ✓ Stage update request approval/denial
- ✓ Geographic visualization (ZIP distribution)
- ✓ Email/SMS campaign management
- ✓ Automated reminders for pending applicants
- ✓ Data reset (for testing)

### Backend API (server.js)
- ✓ Express.js REST API with proper routing
- ✓ **Field normalization**: Database uses snake_case, API returns camelCase
- ✓ **Draft vs Submitted tracking**: Proper distinction using `applicationStatus`
- ✓ **Accurate metrics**: Backend calculates, frontend displays (no double-counting)
- ✓ **Engagement counting**: Counters increment by actual recipient count
- ✓ **SendGrid webhook tracking**: Real open/click events update dashboard metrics
- ✓ Automated reminder scheduling (every 60 seconds)
- ✓ Comprehensive campaign tracking

## 🛠 Technologies

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript (ES6+)
- Fetch API with async/await
- WSSU colors: Red (#b20710), Black, White

**Backend:**
- Node.js 16+
- Express.js (web framework)
- better-sqlite3 (SQLite driver)
- bcryptjs (password hashing)
- nodemailer (email sending via Gmail SMTP)
- dotenv (environment variable loading)
- CORS middleware

**Database:**
- SQLite (auto-created on first run)
- 4 tables: applicants, engagement, stage_requests, admin_users
- Seeded with default admin user

## 📦 Installation

### Prerequisites
- Node.js 16+ ([download](https://nodejs.org/))
- npm (included with Node.js)

### Setup Steps

1. **Navigate to project folder:**
   ```bash
   cd "c:\Users\nasha\OneDrive\Desktop\Student demo\bridge-recruitment-app"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   This installs Express, better-sqlite3, bcryptjs, nodemailer, dotenv, and cors.

3. **Create your `.env` file:**
   ```bash
   # Copy the example file
   copy .env.example .env
   ```
   Then open `.env` in a text editor and fill in your Gmail credentials:
   ```
   EMAIL_USER=yourgmail@gmail.com
   EMAIL_PASS=your_gmail_app_password_here
   ```
   > **Important:** This is a Gmail *App Password*, NOT your normal Gmail login password.
   > See the "Gmail App Password" section below for setup steps.

4. **Start the server:**
   ```bash
   npm start
   ```
   
   Output:
   ```
   ========================================
   WSSU Bridge Recruitment Server
   Running on http://localhost:4000
   Database: ./bridge-recruitment.db
   Admin: admin / bridge123
   ========================================
   ```
   
   Keep this terminal window open while testing.

### Gmail App Password Setup

The app sends real verification emails using Gmail SMTP via Nodemailer.
Gmail does not allow your normal password for app access — you must create an **App Password**.

> **Note:** Gmail SMTP is used for development/demo and small-scale use.
> For a production system, switch to a dedicated provider like Resend or SendGrid.

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Navigate to **Security** > **2-Step Verification** and make sure it is **enabled**
3. Go to **Security** > **App passwords**
4. Choose App: `Mail`, Device: `Other` → type a name like `WSSU Bridge`
5. Click **Generate** — copy the 16-character password shown
6. Paste it as `EMAIL_PASS` in your `.env` file

> **Note:** Gmail may occasionally send messages to the recipient's spam folder.
> Gmail also has a daily sending limit (~500 emails/day for regular accounts).
> For class demos this is more than sufficient.

4. **Open student portal:**
   - Direct file path: `c:\Users\nasha\OneDrive\Desktop\Student demo\bridge-recruitment-app\index.html`
   - In browser: `file:///c:/Users/nasha/OneDrive/Desktop/Student%20demo/bridge-recruitment-app/index.html`

5. **Open admin dashboard:**
   - Direct file path: `c:\Users\nasha\OneDrive\Desktop\Student demo\bridge-recruitment-app\admin.html`
   - In browser: `file:///c:/Users/nasha/OneDrive/Desktop/Student%20demo/bridge-recruitment-app/admin.html`

## 🧪 Testing Guide

### Student Portal

1. **Test eligibility check:**
   - Enter `27101` (valid Forsyth County) → Green success message ✓
   - Enter `90210` (invalid) → Red error message ✗

2. **Test application submission:**
   - Fill form with valid data
   - Use Forsyth County ZIP (27101-27199)
   - Click "Submit Application"
   - Should see success message

3. **Test draft saving:**
   - Fill ZIP code only
   - Click "Save Draft"
   - Should see "Draft saved!" message
   - Database stores as `applicationStatus = 'draft'`

4. **Test application status tracking:**
   - Enter email in "Find your application" section
   - Click "Get My Stage"
   - Should display current application status

5. **Test email verification:**
   - Enter your real email address in the verification section
   - Click "Send Verification Code"
   - Check your inbox — you should receive an email from WSSU Bridge with a 6-digit code
   - Check your **spam folder** if the email doesn't arrive within a minute
   - Paste the code and click "Confirm Verification"
   - Should confirm successful verification
   > If sending fails, check that your `.env` file exists, EMAIL_USER and EMAIL_PASS are set,
   > and your Gmail App Password is correct.

6. **Test stage update request:**
   - Enter email and select desired stage
   - Click "Submit Request"
   - Later approve in admin dashboard
   - Metrics update when approved

7. **Test engagement tracking:**
   - Click email/SMS buttons
   - Counters increment
   - Quick stats update

8. **Test auto-reminders:**
   - Submit an application
   - Click "Auto-send reminders" or wait 60 seconds
   - Check server console for reminder logs
   - Email counter increases by actual count processed

### Admin Dashboard

1. **Login:**
   - Username: `admin`
   - Password: `bridge123`
   - Click "Login"

2. **View metrics:**
   - Total applicants (includes draft + submitted)
   - Eligible applicants (Forsyth County ZIP)
   - First-gen applicants
   - Completion rate (submitted / total started)
   - Email/SMS engagement counters

3. **Manage applicants:**
   - Table shows all applicants
   - Dropdown + "Move" button changes stage
   - Metrics update automatically

4. **Test filtering:**
   - Search by name: Enter "jane"
   - Filter by ZIP: Enter "27101"
   - Filter by interest: Select "Computer Science"
   - Click "Apply"
   - Table updates in real-time
   - Click "Clear" to reset

5. **Approve stage requests:**
   - "Student Stage Requests" section shows pending items
   - Click "Approve" → stage updates
   - Click "Deny" → request removed
   - Metrics reflect changes

6. **View geographic data:**
   - Bar chart shows applicant distribution by ZIP
   - Sorted by highest count first

7. **Test campaigns:**
   - Enter campaign name: "Summer Bridge"
   - Enter custom message
   - Click "Simulate Campaign (Email/SMS)"
   - Email/SMS counters increment by number of eligible recipients
   - Server logs campaign execution

## 📡 SendGrid Event Webhooks (Open/Click Tracking)

SendGrid Event Webhooks let SendGrid push email engagement events (like opens and clicks)
to your backend.

This project now exposes:

- `POST /api/sendgrid/events`

The backend processes webhook event arrays and increments:

- `emailOpen` when event type is `open`
- `emailClick` when event type is `click`

This means the dashboard open/click metrics now depend on SendGrid webhook delivery,
instead of manual simulation only.

### Configure in SendGrid

1. In SendGrid, go to **Settings** > **Mail Settings** > **Event Webhook**
2. Enable Event Webhook
3. Set the POST URL to your backend endpoint
4. Select at least these event types:
   - Open
   - Click

Example local URL:

- `http://localhost:4000/api/sendgrid/events`

Important: SendGrid cannot call localhost directly from the internet.
For local testing, use a tunnel (for example ngrok) or deploy your backend.

Examples:

- ngrok tunnel URL forwarded to localhost
- deployed backend URL (Render, Railway, etc.)

### Security Note

For production, enable and enforce signed webhook verification.
The current implementation keeps the first version beginner-friendly and focuses on
reliable event counting.

8. **Data reset:**
   - Click "Reset All Data"
   - Confirm in prompt
   - All data cleared
   - Database ready for new test cycle

9. **Logout:**
   - Click "Logout" button in header
   - Dashboard hides, login form appears

## 🔑 Default Admin Credentials

Username: `admin`
Password: `bridge123`

⚠️ **Note**: Default credentials are for class projects. Production systems require proper password hashing and authentication.

## 📊 Database Schema

### applicants
- `id` — Primary key (auto-increment)
- `name`, `email`, `phone`, `school`, `zip` — Contact info
- `grad_year`, `first_gen`, `interests` — Demographics
- `application_status` — `'draft'` or `'submitted'` (NEW: Critical fix)
- `stage` — Workflow: `'submitted'`, `'under-review'`, `'accepted'`, `'enrolled'`
- `eligible` — Boolean (0=false, 1=true)
- `verified` — Email verified status
- `reminder_sent` — Auto-reminder flag
- `submitted_at`, `updated_at` — Timestamps

### engagement
- Single row tracking global metrics:
- `email_sent`, `email_open`, `email_click`, `sms_sent`
- `form_started`, `form_submissions`, `zip_checks`

### stage_requests
- `id`, `applicant_id` (foreign key) — Request metadata
- `requested_stage` — Target stage for student
- `status` — `'pending'`, `'approved'`, `'denied'`
- `created_at` — Timestamp

### admin_users
- `id`, `username`, `password` — Admin accounts
- Default: admin / bridge123

## 🔌 API Endpoints

Base URL: `http://localhost:4000`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/applicants` | Fetch all applicants (normalized fields) |
| POST | `/api/applicants` | Create applicant (draft or submitted) |
| PUT | `/api/applicants/:id` | Update stage, verification, etc. |
| GET | `/api/metrics` | Get comprehensive dashboard metrics |
| POST | `/api/engagement` | Track engagement action |
| GET | `/api/requests` | Fetch pending stage requests |
| POST | `/api/requests` | Create stage update request |
| PUT | `/api/requests/:id` | Approve/deny request |
| POST | `/api/verification/send` | Send verification code (logs to console) |
| POST | `/api/verification/confirm` | Verify code |
| POST | `/api/reminders/run` | Trigger automated reminders |
| POST | `/api/campaigns/run` | Execute email/SMS campaign |
| POST | `/api/login` | Admin authentication |

## 📝 Important Implementation Details

### Field Normalization (FIX #1)
- **Database**: Uses snake_case (`first_gen`, `grad_year`, `submitted_at`)
- **API Response**: Returns camelCase (`firstGen`, `gradYear`, `submittedAt`)
- **Benefit**: Frontend works with natural JavaScript naming; database uses SQL conventions
- **Function**: `normalizeApplicant(row)` converts on every GET

### Draft vs Submitted (FIX #2)
- **`applicationStatus = 'draft'`**: Incomplete, shouldn't count toward submissions
- **`applicationStatus = 'submitted'`**: Official submission, counts toward metrics
- **`stage`**: Separate field for workflow (submitted→under-review→accepted→enrolled)
- **Benefit**: Accurate completion rates without double-counting

### Metrics Accuracy (FIX #3)
- **Backend calculates**: `GET /api/metrics` computes all totals server-side
- **No frontend recalc**: Frontend just displays backend values
- **Reminder/Campaign counting**: Increment by actual recipient count
  - If 45 pending applicants → `email_sent += 45` (not += 1)
- **Benefit**: Reliable metrics, no sync issues

### HTML Structure (FIX #4)
- **admin.html**: Proper nesting with login section + dashboard section
- **Login section** (`#loginSection`): Shown by default
- **Dashboard section** (`#dashboardSection`): Hidden until login
- **Benefit**: Valid HTML, no rendering issues

## 🎓 What Each Fix Addressed

| Fix | Problem | Solution |
|-----|---------|----------|
| 1 | Field mismatch breaking filtering | Added `normalizeApplicant()` helper |
| 2 | Drafts counted as submissions | Use `applicationStatus` field distinction |
| 3 | Campaign counters unreliable | Backend counts actual recipients |
| 4 | Invalid HTML structure | Properly nested login + dashboard sections |
| 5 | README overstating features | Accurately document actual behavior |

## 🚀 Future Enhancements

- Real email integration (SendGrid/Gmail API)
- SMS integration (Twilio)
- Secure authentication (JWT + bcrypt)
- Email templates
- Advanced analytics (retention, school-by-school)
- Multi-stage approval workflows
- Persistent file uploads
- Mobile app

## 📞 Troubleshooting

**Server won't start:**
- Check if port 4000 is in use
- Verify Node.js installed: `node --version`
- Check database permissions

**Frontend can't connect:**
- Ensure server is running (`npm start` in one terminal)
- Check browser console (F12) for fetch errors
- Verify API endpoints accessible: `curl http://localhost:4000/api/applicants`

**Data not persisting:**
- Check database file: `bridge-recruitment.db` created?
- Server console errors?
- Check SQLite schema: Use SQLite browser to inspect tables

**Metrics incorrect:**
- Refresh admin dashboard
- Check if backend calculations changed
- Verify `applicationStatus` distinction is being used

##📄 License

Educational use. Developed for Winston-Salem State University.

---

**Version**: 2.0 (Full-stack with fixes)  
**Last Updated**: March 31, 2026  
**Status**: Production-ready prototype


A full-stack web application designed to support recruitment for pre-college STEM bridge programs targeting first-generation and underrepresented students in Forsyth County, Winston-Salem, NC.

## Overview

This platform streamlines the recruitment process by:
- Providing a student-facing application portal
- Enabling administrators to review and track applicants
- Offering engagement analytics and campaign tracking
- Supporting email verification and application status tracking
- Using a backend API with SQLite for persistent data storage

## Features

### Student Portal (index.html)
- **Program Information**: Hero section with program overview and embedded video with captions
- **Eligibility Check**: ZIP code validation for Forsyth County/Winston-Salem students
- **Application Form**: Simplified form to reduce incomplete submissions
  - Personal info (name, email, phone)
  - School information
  - Interest indicators (Computer Science, Data Science, Engineering, Mathematics, Robotics, AI/ML)
  - First-generation student status
  - Application motivation statement
- **Draft Saving**: Save incomplete applications for later completion
- **Application Tracking**: Check application status by email
- **Email Verification**: Code-based verification system
- **Stage Requests**: Students can request application stage updates (pending admin approval)
- **Progress Tracker**: Real-time metrics showing application stage counts (submitted, under-review, accepted, enrolled)
- **Engagement Simulation**: Track email and SMS campaign responses

### Admin Dashboard (admin.html)
- **Admin Login**: Session-based authentication
  - Default credentials: `admin` / `bridge123`
  - Simple authentication (suitable for class projects)
- **Applicant Management**:
  - View all applicants in searchable table
  - Filter by name, ZIP code, or interest area
  - Update applicant stages directly (submitted → under-review → accepted → enrolled)
  - Applications table shows all relevant student data
- **Stage Update Requests**: 
  - Review student requests for application stage updates
  - Approve or deny each request
  - Updates reflected in real-time
- **Analytics Dashboard**:
  - Total applicants and eligible applicants count
  - First-generation student tracking
  - Application completion rates
  - Email/SMS engagement metrics
  - Stage distribution (submitted, under-review, accepted, enrolled)
- **Geographic Visualization**: Bar chart showing applicant distribution by ZIP code (top 10 ZIPs)
- **Campaign Management**: Run targeted email/SMS campaigns to all eligibile applicants
- **Reminder System**: Automated reminders for pending applicants (every 60 seconds or manual trigger)
- **Data Management**: Reset functionality for testing (clears database and recreates default state)
- **Logout**: Session management with logout button

## Technologies

### Frontend
- **HTML5** — Semantic markup with WCAG accessibility features
- **CSS3** — Mobile-first responsive design (WSSU brand colors: red #b20710, black, white)
- **JavaScript (Vanilla)** — Async/await with fetch API, no external frameworks

### Backend
- **Node.js** — JavaScript runtime
- **Express.js** — Web application framework with routing and middleware
- **SQLite** — Lightweight embedded database (via better-sqlite3)
- **CORS** — Cross-origin resource sharing middleware

### Database
- **SQLite** with 4 tables: applicants, engagement, stage_requests, admin_users
- Auto-creates database on first run with seeded default admin user

## Setup Instructions

### Prerequisites
- Node.js 16+ installed ([download here](https://nodejs.org/))
- npm (comes automatically with Node.js)

### Installation

1. **Navigate to project directory:**
   ```bash
   cd "c:\Users\nasha\OneDrive\Desktop\Student demo\bridge-recruitment-app"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

   This installs:
   - `express` — Web framework
   - `better-sqlite3` — Synchronous SQLite driver (beginner-friendly)
   - `cors` — Cross-origin request handling

3. **Start the backend server:**
   ```bash
   npm start
   ```

   Expected output:
   ```
   ========================================
   WSSU Bridge Recruitment Server
   Running on http://localhost:4000
   Database: ./bridge-recruitment.db
   Admin: admin / bridge123
   ========================================
   ```

   **Note:** Keep this terminal window open while testing the app.

4. **Open the student portal:**
   - Open `index.html` directly in your browser (file path method)
   - Or open: `file:///c:/Users/nasha/OneDrive/Desktop/Student%20demo/bridge-recruitment-app/index.html`

5. **Access the admin dashboard:**
   - Open `admin.html` in browser
   - File path: `file:///c:/Users/nasha/OneDrive/Desktop/Student%20demo/bridge-recruitment-app/admin.html`
   - Or: `file:///c:/Users/nasha/OneDrive/Desktop/Student%20demo/bridge-recruitment-app/admin.html`
   - Login with default credentials (see below)

## How to Test

### Test Student Portal (index.html)

1. **Start the server** (see Setup Instructions above)
2. **Open `index.html`** in your browser
3. **Test eligibility check:**
   - Try ZIP code `27101` (valid — Forsyth County) ✓
   - Try ZIP code `12345` (invalid — outside service area) ✗
4. **Submit an application:**
   - Fill out form with test data
   - Use valid Forsyth County ZIP (e.g., `27101`, `27102`, `27103`)
   - Click "Submit Application" button
   - Verify success message displays
5. **Test draft saving:**
   - Fill out partial form
   - Click "Save Draft" button
   - Later, submit the rest
6. **Test application tracking:**
   - Enter your test email in "Find your application" section
   - Click "Get My Stage" 
   - Should display current stage: "submitted" or other stage
7. **Test email verification:**
   - Click "Send Verification Code"
   - **Check server console** (terminal running npm start) for verification code (e.g., 123456)
   - Paste code into verification input field
   - Click "Confirm Verification" button
   - Should confirm: "Email verified successfully!"
8. **Test stage update request:**
   - In "Request stage update" section
   - Enter email and select "Request Under Review"
   - Click "Submit Request"
   - Message: "Stage update request...submitted, pending admin verification"
   - Later approve in admin dashboard
9. **Test engagement tracking:**
   - Click "Simulate Email Campaign Send" button
   - Message shows "Email campaign sent. Total: 1"
   - Repeat for other engagement buttons
   - Metrics update in "Quick Stats" section
10. **Test auto-reminders:**
    - Click "Auto-send reminders to Pending applicants" button
    - Server processes and updates count
    - Check server console for reminder logs

### Test Admin Dashboard (admin.html)

1. **Open `admin.html`** in browser
2. **Login form appears** with username and password fields
3. **Login with default credentials:**
   - Username: `admin`
   - Password: `bridge123`
   - Click login button
4. **Dashboard loads** (if login fails, check server console for errors)
5. **View metrics** in top cards:
   - Total applicants, eligible, first-gen, completion rate, email sends, etc.
6. **Test applicant management:**
   - View applicant list table with all submitted applications
   - Use filters section:
     - Search by Name: Enter "jane" → filters table to matching names
     - Filter by ZIP: Enter "27101" → shows only that ZIP code
     - Filter by Interest: Select "Computer Science" → shows only CS-interested
     - Click "Apply" to filter
     - Click "Clear" to reset filters
   - Action column dropdown: Select new stage for applicant
   - Click "Move" button → stage updates immediately
7. **Test stage update approval:**
   - Submit stage request from student portal
   - In admin "Student Stage Requests" section
   - See pending request with edit buttons
   - Click "Approve" → stage updates, request cleared
   - Or click "Deny" → request removed, stage unchanged
8. **View geographic visualization:**
   - Bar chart shows applicants by ZIP code
   - Top 10 ZIPs with highest applicant count
   - Visual indicator of recruitment density
9. **Test campaigns:**
   - Enter campaign name: "Summer Bridge 2026"
   - Enter message: "Join our program!"
   - Click "Simulate Campaign" button
   - Result confirmation shown
   - **Check server console** for campaign logs
   - Email metrics increase
10. **Test logout:**
    - Click "Logout" button in top banner
    - Redirected back to login form
    - Session cleared
11. **Optional: Reset data**
    - Click "Reset All Data" button (confirm prompt)
    - Database clears
    - Restart server to recreate with default admin user

## Default Admin Credentials

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `bridge123` |

**Important:** This is a class project with simple credentials. For production, implement:
- Password hashing (bcrypt)
- JWT tokens
- Secure session management
- HTTPS/SSL

## Example Workflow for Classroom Demonstration

This example shows a complete student journey from application to approval.

### Step 1: Student Application
1. Open student portal (`index.html`)
2. Check eligibility:
   - Enter ZIP: `27101`
   - Result: "Great news! Your ZIP is in Forsyth County service area."
3. Submit application with sample data:
   - Name: "Alex Johnson"
   - Email: "alex@example.com"
   - Phone: "(336) 555-0101"
   - School: "East Forsyth High School"
   - ZIP: "27101"
   - Expected Graduation Year: "2025"
   - First-generation: "Yes"
   - Interests: Check "Computer Science" and "Data Science"
   - Motivation: "I'm excited to learn about STEM and prepare for college"
4. Click "Submit Application"
5. Success message: "Application submitted! We will contact you with next steps."

### Step 2: Email Verification
1. Still on student portal
2. In "Email verification" section:
   - Email: "alex@example.com"
   - Click "Send Verification Code"
   - **Check server console** for 6-digit code (e.g., 482917)
3. Enter code in verification input field
4. Click "Confirm Verification"
5. Confirmation: "Email verified successfully!"

### Step 3: Check Status
1. In "Find your application" section:
   - Email: "alex@example.com"
   - Click "Get My Stage"
   - Result: "Status: submitted. You are eligible."

### Step 4: Request Stage Update
1. In "Request stage update" section:
   - Email: "alex@example.com"
   - Select: "Request Under Review"
   - Click "Submit Request"
   - Message: "Stage update request for under-review submitted, pending admin verification"

### Step 5: Admin Review
1. Open admin dashboard (`admin.html`)
2. Login with `admin` / `bridge123`
3. In "Student Stage Requests" section:
   - See request: "Alex Johnson (alex@example.com) requests under-review from submitted"
   - Click "Approve" button
4. Stage updates to "under-review"
5. Progress tracker metrics update: "Under Review" count now shows 1

### Step 6: Admin Manual Update
1. In applicants table:
   - Find Alex's row
   - Action dropdown: Change from "under-review" to "accepted"
   - Click "Move" button
2. Alex's stage updates to "accepted"
3. Metrics update: "Accepted" count increases

### Step 7: Campaign
1. In "Targeted Communication Workflow" section:
   - Campaign Name: "Acceptance Notifications"
   - Message: "Congratulations! You're accepted to our STEM Bridge Program."
   - Click "Simulate Campaign"
2. Confirmation: "Campaign executed. Email and SMS activity tracked for [count] contacts."
3. **Server console** shows campaign log entries

### Step 8: Final Status Check (Student)
1. Back to student portal
2. "Find your application" with "alex@example.com"
3. Click "Get My Stage"
4. Result: "Status: accepted. You are eligible."

## File Structure

```
bridge-recruitment-app/
├── index.html                  # Student portal frontend
├── admin.html                  # Admin dashboard frontend
├── styles.css                  # Shared styling (WSSU colors)
├── script.js                   # Frontend JavaScript (fetch API calls)
├── server.js                   # Express backend with SQLite
├── package.json                # NPM dependencies
├── captions.vtt                # Video captions for accessibility
├── bridge-recruitment.db       # SQLite database (auto-created)
└── README.md                   # This file
```

## Database Schema

### Table: applicants
Stores student application data.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key, auto-increment |
| name | TEXT | Student name |
| email | TEXT | Email (unique) |
| phone | TEXT | Phone number |
| school | TEXT | High school name |
| zip | TEXT | ZIP code (must be in allowed list) |
| grad_year | INTEGER | Expected graduation year |
| first_gen | TEXT | "yes" or "no" |
| interests | TEXT | JSON array of interests |
| note | TEXT | Student motivation/message |
| eligible | INTEGER | 1=eligible, 0=out-of-area |
| stage | TEXT | "submitted", "under-review", "accepted", "enrolled" |
| reminder_sent | INTEGER | Flag: reminders sent (0/1) |
| verification_code | TEXT | For email verification |
| verified | INTEGER | 1=verified, 0=pending (0/1) |
| submitted_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

### Table: engagement
Global engagement metrics (single row).

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Always 1 (single record) |
| email_sent | INTEGER | Total emails sent |
| email_open | INTEGER | Total email opens |
| email_click | INTEGER | Total email link clicks |
| sms_sent | INTEGER | Total SMS sent |
| form_started | INTEGER | Form starts tracked |
| form_submissions | INTEGER | Completed submissions |
| zip_checks | INTEGER | ZIP eligibility checks |

### Table: stage_requests
Student requests to update application stage.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| applicant_id | INTEGER | Foreign key to applicants |
| requested_stage | TEXT | Requested stage |
| status | TEXT | "pending", "approved", "denied" |
| created_at | TEXT | ISO timestamp |

### Table: admin_users
Admin login credentials.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| username | TEXT | Username (unique) |
| password | TEXT | Password (plaintext for class project) |

## API Endpoints

All endpoints run on `http://localhost:4000`

### Authentication
- **POST** `/api/login` — Admin login
  - Body: `{username, password}`
  - Response: `{success: true, token}`

### Applicants
- **GET** `/api/applicants` — List all applicants
  - Response: `[{id, name, email, phone, school, zip, stage, eligible, ...}, ...]`
- **POST** `/api/applicants` — Create new applicant
  - Body: `{name, email, phone, school, zip, gradYear, firstGen, interests, note, eligible}`
  - Response: `{success: true, id}`
- **PUT** `/api/applicants/:id` — Update applicant
  - Body: `{stage}` or `{verified: true}` or any field
  - Response: `{success: true}`

### Analytics
- **GET** `/api/metrics` — Get all metrics
  - Response: `{totalApplicants, eligible, firstGen, completionRate, emailSent, emailOpen, ...}`

### Engagement
- **POST** `/api/engagement` — Track engagement action
  - Body: `{action}` (e.g., "emailSent", "zipCheck", "emailOpen")
  - Response: `{success: true}`

### Stage Requests
- **GET** `/api/requests` — Get pending requests
  - Response: `[{id, applicant_id, requested_stage, status, created_at, ...}, ...]`
- **POST** `/api/requests` — Create stage request
  - Body: `{email, stageRequest}`
  - Response: `{success: true, id}`
- **PUT** `/api/requests/:id` — Approve/deny
  - Body: `{action: "approve"}` or `{action: "deny"}`
  - Response: `{success: true}`

### Email Verification
- **POST** `/api/verification/send` — Send verification code
  - Body: `{email}`
  - Response: `{success: true, code}` (code logged to console)
- **POST** `/api/verification/confirm` — Confirm code
  - Body: `{email, code}`
  - Response: `{success: true}` or error

### Campaigns & Reminders
- **POST** `/api/reminders/run` — Trigger reminders
  - Response: `{success: true, count}`
- **POST** `/api/campaigns/run` — Run campaign
  - Body: `{campaign, message}`
  - Response: `{success: true}`

## Allowed ZIP Codes

Forsyth County / Winston-Salem service area:

```
27040, 27101, 27102, 27103, 27104, 27105, 27106, 27107, 27108, 27109, 
27110, 27111, 27112, 27113, 27114, 27115, 27116, 27117, 27120, 27127, 
27130, 27150, 27151, 27152, 27153, 27155, 27157, 27198, 27199
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| **Port 4000 already in use** | Close other apps using port 4000, or set `PORT=5000` in terminal before `npm start` |
| **npm install fails** | Update Node.js to v16+. Try `npm cache clean --force` then `npm install` again |
| **Database locked** | Stop server (Ctrl+C), delete `bridge-recruitment.db`, restart server |
| **Can't find verification code** | Check **server console** (terminal window running npm start) — code is printed there |
| **Admin login doesn't work** | Verify server is running, check username/password are exactly `admin` / `bridge123` (case-sensitive) |
| **Applicants not loading in admin** | Check server console for errors. Try refreshing page (Ctrl+R). Ensure server is running |
| **Frontend can't reach backend** | Verify server running on port 4000. Check browser console (F12) for fetch errors |

## Notes for Instructors & Students

- **Educational Focus:** Code is intentionally simple for learning (single-file server, no ORM, plaintext passwords)
- **Beginner-Friendly:** All functions have comments. No complex design patterns.
- **Self-Contained:** Works offline except for real email/SMS (uses console logging for testing)
- **Extensible:** Students can add features:
  - Real email integration (SendGrid, Mailgun)
  - SMS integration (Twilio)
  - Password hashing (bcrypt)
  - JWT authentication
  - Advanced analytics
  - Automated reminders with scheduling (node-cron)
  - Student dashboard (personalized view)
  - Export reports (CSV, PDF)

## Future Enhancements

- Real email/SMS integration (SendGrid, Twilio)
- Password hashing and JWT authentication
- Student dashboard (personalized applicant view)
- Multi-stage workflows with detailed progress indicators
- File uploads (resumes, transcripts, essays)
- Role-based access control (multiple admin roles)
- Advanced analytics and reporting (CSV/PDF export)
- Email templates and customizable campaigns
- Scheduled reminders (cron jobs)
- Multi-language support
- Mobile app (React Native, Flutter)

## License

Educational use only. WSSU Bridge Program.

---

**Last Updated:** March 31, 2026  
**Version:** 2.0 (Full-stack with SQLite backend, admin login, draft saving)

