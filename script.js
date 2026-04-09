// =============================================================================
// API Helper Functions - Clean wrapper for all backend calls
// =============================================================================

// Use same-origin API base so deployed frontend calls the deployed backend host.
// Local development still works because frontend and backend are served from the same app.
const API_BASE = '';

async function apiGet(endpoint) {
  const headers = { 'Content-Type': 'application/json' };
  
  // Add authorization header for admin routes
  if (endpoint.startsWith('/api/admin-')) {
    const token = getAdminToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  try {
    const response = await fetch(API_BASE + endpoint, { headers });
    if (!response.ok) {
      // Handle unauthorized responses
      if (response.status === 401 && endpoint.startsWith('/api/admin-')) {
        handleUnauthorized();
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API GET failed:', error);
    return null;
  }
}

async function apiPost(endpoint, data) {
  const headers = { 'Content-Type': 'application/json' };
  
  // Add authorization header for admin routes
  if (endpoint.startsWith('/api/admin-')) {
    const token = getAdminToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  try {
    const response = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      // Handle unauthorized responses
      if (response.status === 401 && endpoint.startsWith('/api/admin-')) {
        handleUnauthorized();
        return null;
      }

      // Preserve backend validation errors (for example: { error: 'Email already exists' }).
      // This allows forms to show specific messages instead of a generic fallback.
      let errorPayload = null;
      try {
        errorPayload = await response.json();
      } catch (parseError) {
        // If response is not JSON, fall back to generic handling below.
      }

      if (errorPayload && typeof errorPayload === 'object') {
        return errorPayload;
      }

      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API POST failed:', error);
    return null;
  }
}

async function apiPut(endpoint, data) {
  const headers = { 'Content-Type': 'application/json' };
  
  // Add authorization header for admin routes
  if (endpoint.startsWith('/api/admin-')) {
    const token = getAdminToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  try {
    const response = await fetch(API_BASE + endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      // Handle unauthorized responses
      if (response.status === 401 && endpoint.startsWith('/api/admin-')) {
        handleUnauthorized();
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API PUT failed:', error);
    return null;
  }
}

// Helper function for DELETE requests
async function apiDelete(endpoint) {
  const headers = { 'Content-Type': 'application/json' };
  
  // Add authorization header for admin routes
  if (endpoint.startsWith('/api/admin-')) {
    const token = getAdminToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  try {
    const response = await fetch(API_BASE + endpoint, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) {
      // Handle unauthorized responses
      if (response.status === 401 && endpoint.startsWith('/api/admin-')) {
        handleUnauthorized();
        return null;
      }
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API DELETE failed:', error);
    return null;
  }
}

async function getIncompleteDraftByEmail(email) {
  try {
    const response = await fetch(`${API_BASE}/api/applicants/draft?email=${encodeURIComponent(email)}`);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: payload.error || 'Could not load saved draft.'
      };
    }

    return { success: true, data: payload };
  } catch (error) {
    console.error('Draft lookup failed:', error);
    return { success: false, status: 0, error: 'Could not connect to the server.' };
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

// ZIP codes for Forsyth County / Winston-Salem
const allowedForsythZips = new Set([
  '27040', '27101', '27102', '27103', '27104', '27105', '27106', '27107',
  '27108', '27109', '27110', '27111', '27112', '27113', '27114', '27115',
  '27116', '27117', '27120', '27127', '27130', '27150', '27151', '27152',
  '27153', '27155', '27157', '27198', '27199'
]);

function humanizePercent(num) {
  return Number.isFinite(num) ? `${Math.round(num)}%` : '0%';
}

function normalizeInterests(rawInterests) {
  if (Array.isArray(rawInterests)) return rawInterests;
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

function getApplicationStatus(applicant) {
  const rawStatus = applicant.applicationStatus || applicant.application_status || '';
  const normalized = String(rawStatus).trim().toLowerCase();

  // Backward compatibility: old records may still use "draft".
  if (normalized === 'draft' || normalized === 'incomplete') return 'incomplete';
  if (normalized === 'submitted') return 'submitted';

  // Default to submitted for unknown/empty values.
  return 'submitted';
}

// Stores the currently displayed admin rows so export matches active filters.
let currentAdminApplicantsForExport = [];

function csvEscape(value) {
  const normalized = value == null ? '' : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

function humanizeLabel(value) {
  return String(value || '')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, ch => ch.toUpperCase());
}

function buildApplicantsCsv(applicants) {
  const header = [
    'Name',
    'Email',
    'Phone',
    'School',
    'ZIP',
    'Graduation Year',
    'First-Gen',
    'Interests',
    'Eligible',
    'Application Status',
    'Stage',
    'Note',
    'Submitted At',
    'Updated At'
  ];

  const rows = applicants.map(app => {
    const interests = normalizeInterests(app.interests).join(', ');
    const gradYear = app.gradYear ?? app.grad_year ?? '';
    const firstGen = app.firstGen ?? app.first_gen ?? '';
    const eligibleLabel = app.eligible ? 'Eligible' : 'Out-of-area';
    const statusLabel = humanizeLabel(getApplicationStatus(app));
    const stageLabel = humanizeLabel(app.stage || 'submitted');
    const submittedAt = app.submittedAt ?? app.submitted_at ?? '';
    const updatedAt = app.updatedAt ?? app.updated_at ?? '';

    return [
      app.name || '',
      app.email || '',
      app.phone || '',
      app.school || '',
      app.zip || '',
      gradYear,
      firstGen,
      interests,
      eligibleLabel,
      statusLabel,
      stageLabel,
      app.note || '',
      submittedAt,
      updatedAt
    ].map(csvEscape).join(',');
  });

  return [header.map(csvEscape).join(','), ...rows].join('\n');
}

function downloadApplicantsCsv(applicants) {
  const csvContent = buildApplicantsCsv(applicants);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const datePart = new Date().toISOString().split('T')[0];

  link.href = url;
  link.download = `applicants-${datePart}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function fillApplicationFormFromDraft(draft) {
  const form = document.getElementById('applicationForm');
  if (!form || !draft) return;

  const setValue = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
  };

  setValue('fullName', draft.name);
  setValue('email', draft.email);
  setValue('phone', draft.phone);
  setValue('school', draft.school);
  setValue('zip', draft.zip);
  setValue('grade', draft.gradYear);
  setValue('studentMessage', draft.note);

  // First-gen radio
  const firstGenValue = (draft.firstGen || '').toLowerCase();
  const firstGenInputs = form.querySelectorAll('input[name="firstGen"]');
  firstGenInputs.forEach(input => {
    input.checked = input.value === firstGenValue;
  });

  // Interest checkboxes
  const interestSet = new Set(Array.isArray(draft.interests) ? draft.interests : []);
  const interestInputs = form.querySelectorAll('input[name="interests"]');
  interestInputs.forEach(input => {
    input.checked = interestSet.has(input.value);
  });
}

// Welcome message helper (fixes undefined username issue)
function updateWelcomeMessage(username) {
  const welcomeEl = document.getElementById('welcomeAdmin');
  const finalText = username ? `Welcome, ${username}` : 'Welcome, Admin';
  if (welcomeEl) {
    welcomeEl.textContent = finalText;
  }
}

// =============================================================================
// Dark Mode Theme Management
// =============================================================================

// Apply theme based on localStorage or default to light
function applyTheme() {
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme === 'dark';
  document.body.classList.toggle('dark-mode', isDark);
  updateThemeToggleButton();
  // Refresh charts only when admin chart elements are on the page.
  if (document.getElementById('stageChart') && typeof loadAndRenderAdminDashboard === 'function') {
    loadAndRenderAdminDashboard();
  }
}

// Toggle between light and dark mode
function toggleDarkMode() {
  const isDark = document.body.classList.contains('dark-mode');
  const newTheme = isDark ? 'light' : 'dark';
  localStorage.setItem('theme', newTheme);
  applyTheme();
}

// Update toggle button text based on current theme
function updateThemeToggleButton() {
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    const isDark = document.body.classList.contains('dark-mode');
    toggleBtn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
  }
}

// Get theme-aware colors for charts
function getChartColors() {
  const isDark = document.body.classList.contains('dark-mode');
  if (isDark) {
    return {
      doughnut: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'], // Lighter reds and blues
      bar: ['#4ecdc4', '#ff6b6b', '#45b7d1', '#f9ca24'],
      zipBar: '#45b7d1'
    };
  } else {
    return {
      doughnut: ['#6c5ce7', '#0984e3', '#00b894', '#fdcb6e'], // Original colors
      bar: ['#0984e3', '#6c5ce7', '#00b894', '#fdcb6e'],
      zipBar: '#00b894'
    };
  }
}

// FAFSA estimator helper.
// This is intentionally simple and class-project friendly.
function evaluateFafsaEligibility({ fafsaCompleted, pellEligible, incomeRange, firstGen }) {
  const incomeUnder50000 = incomeRange === 'under-30000' || incomeRange === '30000-50000';
  const incomeMidRange = incomeRange === '50001-75000';
  const incomeHigh = incomeRange === 'above-75000';

  let status = 'possibly';
  let message = 'Possibly Eligible: You may qualify, but an advisor should review your case.';

  if (fafsaCompleted !== 'yes' || (incomeHigh && pellEligible !== 'yes')) {
    status = 'review';
    message = 'Needs Review: Please complete FAFSA or speak with an advisor for next steps.';
  } else if (fafsaCompleted === 'yes' && (pellEligible === 'yes' || incomeUnder50000)) {
    status = 'likely';
    message = 'Likely Eligible: Based on your answers, you may qualify for program financial support.';
  } else if (fafsaCompleted === 'yes' && (pellEligible === 'unsure' || incomeMidRange)) {
    status = 'possibly';
    message = 'Possibly Eligible: You may qualify, but an advisor should review your case.';
  }

  if (status !== 'review' && firstGen === 'yes') {
    message += ' Being first-generation may strengthen your support profile.';
  }

  return { status, message };
}

function setupFafsaEstimator() {
  const fafsaForm = document.getElementById('fafsaEstimatorForm');
  const resultEl = document.getElementById('fafsaResult');
  if (!fafsaForm || !resultEl) return;

  fafsaForm.addEventListener('submit', event => {
    event.preventDefault();

    const fafsaCompleted = document.getElementById('fafsaCompleted').value;
    const pellEligible = document.getElementById('pellEligible').value;
    const incomeRange = document.getElementById('incomeRange').value;
    const firstGen = document.getElementById('fafsaFirstGen').value;

    if (!fafsaCompleted || !pellEligible || !incomeRange || !firstGen) {
      resultEl.textContent = 'Please complete all fields before checking eligibility.';
      resultEl.style.color = 'crimson';
      return;
    }

    const result = evaluateFafsaEligibility({
      fafsaCompleted,
      pellEligible,
      incomeRange,
      firstGen
    });

    resultEl.textContent = result.message;
    resultEl.style.color = result.status === 'likely' ? 'green' : (result.status === 'possibly' ? 'orange' : 'crimson');
  });
}

// Chart references (destroy before redraw to avoid stacking duplicates)
let stageChart = null;
let engagementChart = null;
let zipChart = null;
let interestChart = null;

function destroyChart(chart) {
  if (chart) {
    chart.destroy();
  }
}

// =============================================================================
// Render Functions - Update UI with data from backend
// =============================================================================

function formatRatePercent(value) {
  if (!Number.isFinite(value) || value <= 0) return '0%';
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function calculateRate(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

function renderEngagementPerformance(metrics) {
  if (!document.getElementById('perfOpenRate')) return;

  const emailSent = Number(metrics.emailSent) || 0;
  const emailOpen = Number(metrics.emailOpen) || 0;
  const emailClick = Number(metrics.emailClick) || 0;

  const openRate = calculateRate(emailOpen, emailSent);
  const clickRate = calculateRate(emailClick, emailSent);
  const clickToOpenRate = calculateRate(emailClick, emailOpen);

  const updates = {
    perfOpenRate: formatRatePercent(openRate),
    perfClickRate: formatRatePercent(clickRate),
    perfClickToOpenRate: formatRatePercent(clickToOpenRate)
  };

  Object.entries(updates).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function buildCumulativeFunnelCounts(applicants) {
  return {
    submitted: applicants.filter(a => getApplicationStatus(a) === 'submitted').length,
    underReview: applicants.filter(a => ['under-review', 'accepted', 'enrolled'].includes(a.stage)).length,
    accepted: applicants.filter(a => ['accepted', 'enrolled'].includes(a.stage)).length,
    enrolled: applicants.filter(a => a.stage === 'enrolled').length
  };
}

function renderEnrollmentFunnel(applicants, metrics) {
  if (!document.getElementById('funnelSubmitted')) return;

  // Prefer backend-provided cumulative funnel counts. If unavailable,
  // compute on the client from applicant stages as a safe fallback.
  const funnelCounts = metrics?.funnelCounts || buildCumulativeFunnelCounts(applicants);

  const submittedCount = Number(funnelCounts.submitted) || 0;
  const underReviewCount = Number(funnelCounts.underReview) || 0;
  const acceptedCount = Number(funnelCounts.accepted) || 0;
  const enrolledCount = Number(funnelCounts.enrolled) || 0;

  const reviewRate = calculateRate(underReviewCount, submittedCount);
  const acceptRate = calculateRate(acceptedCount, underReviewCount);
  const enrollRate = calculateRate(enrolledCount, acceptedCount);

  const updates = {
    funnelSubmitted: submittedCount,
    funnelUnderReview: underReviewCount,
    funnelAccepted: acceptedCount,
    funnelEnrolled: enrolledCount,
    funnelReviewRate: formatRatePercent(reviewRate),
    funnelAcceptRate: formatRatePercent(acceptRate),
    funnelEnrollRate: formatRatePercent(enrollRate)
  };

  Object.entries(updates).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

function renderAdminMetrics(applicants, metrics) {
  if (!document.getElementById('adminTotalApplicants')) return;

  currentAdminApplicantsForExport = Array.isArray(applicants) ? applicants.slice() : [];

  const totalApplicants = Number(metrics.totalApplicants) || applicants.length || 0;
  const enrolledApplicants = applicants.filter(a => a.stage === 'enrolled').length;
  const incompleteApplicants = applicants.filter(a => getApplicationStatus(a) === 'incomplete').length;
  const conversionRate = calculateRate(enrolledApplicants, totalApplicants);
  
  // FIX: Use metrics directly from backend instead of recalculating
  // Backend already handles field normalization and proper counting
  const updates = {
    adminTotalApplicants: metrics.totalApplicants,
    adminEligible: metrics.eligibleApplicants,
    adminIncomplete: incompleteApplicants,
    adminFirstGen: metrics.firstGenApplicants,
    adminCompletion: formatRatePercent(conversionRate),
    emailSent: metrics.emailSent || 0,
    emailOpened: metrics.emailOpen || 0,
    emailClicked: metrics.emailClick || 0
  };
  
  Object.entries(updates).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
  
  // Render applicant table with stage controls
  const tbody = document.querySelector('#applicantTable tbody');
  if (tbody) {
    tbody.innerHTML = '';

    if (!applicants.length) {
      tbody.innerHTML = '<tr><td colspan="11">No applications yet.</td></tr>';
      return;
    }

    applicants.forEach(app => {
      const interestList = normalizeInterests(app.interests);
      const applicationStatus = getApplicationStatus(app);
      const tr = document.createElement('tr');
      if (applicationStatus === 'incomplete') {
        tr.style.background = 'rgba(178, 7, 16, 0.08)';
      }
      
      // Basic info
      tr.innerHTML = `
        <td>${app.name}</td>
        <td>${app.email}</td>
        <td>${app.phone || '-'}</td>
        <td>${app.school}</td>
        <td>${app.zip}</td>
        <td>${app.firstGen || '-'}</td>
        <td>${interestList.join(', ') || '-'}</td>
        <td>${app.stage || 'submitted'}</td>
        <td>${app.eligible ? 'Eligible' : 'Out-of-area'}</td>
        <td><span class="badge" style="${applicationStatus === 'incomplete' ? 'background:#b20710;color:#fff;' : ''}">${applicationStatus}</span></td>
      `;
      
      // Action cell: single horizontal flex row
      // [ dropdown ] [ Move ] [ Edit ] [ Delete ]
      const actionTd = document.createElement('td');
      actionTd.style.cssText = 'white-space:nowrap;';

      const stageSelect = document.createElement('select');
      stageSelect.style.minWidth = '110px';
      ['submitted', 'under-review', 'accepted', 'enrolled'].forEach(stage => {
        const option = document.createElement('option');
        option.value = stage;
        option.textContent = stage.replace('-', ' ');
        if (app.stage === stage) option.selected = true;
        stageSelect.appendChild(option);
      });

      const moveBtn = document.createElement('button');
      moveBtn.textContent = 'Move';
      moveBtn.className = 'btn btn-secondary';
      moveBtn.addEventListener('click', async () => {
        const newStage = stageSelect.value;
        const result = await apiPut(`/api/applicants/${app.id}`, { stage: newStage });
        if (result) {
          app.stage = newStage;
          await loadAndRenderAdminDashboard();
          await loadAndRenderHomeStats();
        }
      });

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'btn btn-primary';
      editBtn.addEventListener('click', () => {
        openEditModal(app);
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'btn btn-danger';
      deleteBtn.addEventListener('click', async () => {
        const confirmed = confirm(`Are you sure you want to delete ${app.name} (${app.email})? This cannot be undone.`);
        if (!confirmed) return;

        const result = await apiDelete(`/api/applicants/${app.id}`);
        if (result) {
          alert(`${app.name} has been deleted.`);
          await loadAndRenderAdminDashboard();
          await loadAndRenderHomeStats();
        } else {
          alert('Failed to delete applicant. Try again.');
        }
      });

      const actionWrapper = document.createElement('div');
      actionWrapper.style.cssText = 'display:flex; align-items:center; gap:8px; flex-wrap:nowrap;';
      actionWrapper.appendChild(stageSelect);
      actionWrapper.appendChild(moveBtn);
      actionWrapper.appendChild(editBtn);
      actionWrapper.appendChild(deleteBtn);

      actionTd.appendChild(actionWrapper);
      tr.appendChild(actionTd);
      
      tbody.appendChild(tr);
    });
  }

  renderIncompleteFollowUp(applicants);
  
  // Render geographic visualization
  renderGeoViz(applicants);
}

function renderIncompleteFollowUp(applicants) {
  const panel = document.getElementById('incompleteFollowUpPanel');
  if (!panel) return;

  const countEl = document.getElementById('incompleteFollowUpCount');
  const table = document.getElementById('incompleteFollowUpTable');
  const tbody = table ? table.querySelector('tbody') : null;

  const incompleteApplicants = applicants.filter(a => getApplicationStatus(a) === 'incomplete');

  if (incompleteApplicants.length === 0) {
    if (countEl) countEl.textContent = 'No incomplete applications right now.';
    if (tbody) tbody.innerHTML = '';
    if (table) table.style.display = 'none';
    return;
  }

  if (countEl) countEl.textContent = `${incompleteApplicants.length} applicant(s) need follow-up.`;
  if (table) table.style.display = '';
  if (!tbody) return;

  const rows = incompleteApplicants.map(applicant => {
    const lastReminderSent = applicant.last_reminder_sent || applicant.lastReminderSent;
    const reminderSentFlag = Number(applicant.reminder_sent ?? applicant.reminderSent) === 1;

    let reminderDisplay = 'Never';
    let reminderStatus = 'Never Sent';

    // Backward compatibility: older records may have reminder_sent=1 but no timestamp.
    if (lastReminderSent) {
      reminderDisplay = lastReminderSent;
      reminderStatus = 'Sent';
    } else if (reminderSentFlag) {
      reminderDisplay = 'Previously Sent';
      reminderStatus = 'Sent';
    }

    return `<tr>
      <td>${applicant.name}</td>
      <td>${applicant.email}</td>
      <td>${applicant.phone || '-'}</td>
      <td>${applicant.stage || 'submitted'}</td>
      <td>${reminderDisplay}</td>
      <td>${reminderStatus}</td>
    </tr>`;
  }).join('');

  tbody.innerHTML = rows;
}

function renderGeoViz(applicants) {
  const container = document.getElementById('geoViz');
  if (!container) return;
  
  const counts = applicants.reduce((o, a) => {
    o[a.zip] = (o[a.zip] || 0) + 1;
    return o;
  }, {});
  
  const items = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  
  if (items.length === 0) {
    container.innerHTML = '<p>No applicants yet. Map is empty.</p>';
    return;
  }
  
  const max = Math.max(...items.map(i => i[1]));
  container.innerHTML = '';
  

  items.slice(0, 10).forEach(([zip, count]) => {
    const group = document.createElement('div');
    group.className = 'bar-group';
    
    const label = document.createElement('div');
    label.className = 'bar-label';
    label.textContent = `${zip} (${count})`;
    
    const bar = document.createElement('span');
    bar.className = 'bar-fill';
    bar.style.width = `${Math.round((count / max) * 100)}%`;
    
    const value = document.createElement('div');
    value.className = 'bar-value';
    value.textContent = `${count} applicants`;
    
    group.append(label, bar, value);
    container.appendChild(group);
  });
}

function renderStageChart(metrics) {
  if (!metrics || !metrics.stageCounts) return;

  destroyChart(stageChart);
  const ctx = document.getElementById('stageChart');
  if (!ctx) return;

  stageChart = new Chart(ctx.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Incomplete', 'Submitted', 'Under Review', 'Accepted', 'Enrolled'],
      datasets: [{
        data: [
          metrics.incompleteCount || 0,
          metrics.stageCounts.submitted || 0,
          metrics.stageCounts.underReview || 0,
          metrics.stageCounts.accepted || 0,
          metrics.stageCounts.enrolled || 0
        ],
        backgroundColor: ['#9CA3AF', '#3B82F6', '#60A5FA', '#34D399', '#FBBF24']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: document.body.classList.contains('dark-mode') ? '#fff' : '#000'
          }
        }
      }
    }
  });
}

function renderEngagementChart(metrics) {
  if (!metrics) return;

  destroyChart(engagementChart);
  const ctx = document.getElementById('engagementChart');
  if (!ctx) return;

  const colors = getChartColors();
  engagementChart = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Email Sends', 'Email Opens', 'Email Clicks', 'SMS Sends'],
      datasets: [{
        label: 'Engagement',
        data: [
          metrics.emailSent || 0,
          metrics.emailOpen || 0,
          metrics.emailClick || 0,
          metrics.smsSent || 0
        ],
        backgroundColor: colors.bar
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: document.body.classList.contains('dark-mode') ? '#fff' : '#000'
          },
          grid: {
            color: document.body.classList.contains('dark-mode') ? '#333' : '#ddd'
          }
        },
        x: {
          ticks: {
            color: document.body.classList.contains('dark-mode') ? '#fff' : '#000'
          },
          grid: {
            color: document.body.classList.contains('dark-mode') ? '#333' : '#ddd'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function renderZipChart(applicants) {
  if (!applicants) return;

  const counts = applicants.reduce((acc, applicant) => {
    const zip = applicant.zip || 'Unknown';
    acc[zip] = (acc[zip] || 0) + 1;
    return acc;
  }, {});

  const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const labels = sortedEntries.map(([zip]) => zip);
  const dataPoints = sortedEntries.map(([_, count]) => count);

  destroyChart(zipChart);
  const ctx = document.getElementById('zipChart');
  if (!ctx) return;

  const colors = getChartColors();
  zipChart = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Applicants by ZIP',
        data: dataPoints,
        backgroundColor: colors.zipBar
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: document.body.classList.contains('dark-mode') ? '#fff' : '#000'
          },
          grid: {
            color: document.body.classList.contains('dark-mode') ? '#333' : '#ddd'
          }
        },
        x: {
          ticks: {
            color: document.body.classList.contains('dark-mode') ? '#fff' : '#000'
          },
          grid: {
            color: document.body.classList.contains('dark-mode') ? '#333' : '#ddd'
          }
        }
      }
    }
  });
}

function renderInterestAnalytics(metrics) {
  if (!metrics || !metrics.interestCounts) return;

  const interestMap = {
    'Computer Science': 'interestComputerScience',
    'Information Technology': 'interestInformationTechnology',
    'AI/ML': 'interestAIML',
    'Data Science': 'interestDataScience',
    'Engineering': 'interestEngineering',
    'Mathematics': 'interestMathematics',
    'Robotics': 'interestRobotics'
  };

  Object.entries(interestMap).forEach(([label, elementId]) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = metrics.interestCounts[label] || 0;
    }
  });

  destroyChart(interestChart);
  const ctx = document.getElementById('interestChart');
  if (!ctx) return;

  const labels = Object.keys(interestMap);
  const values = labels.map(label => metrics.interestCounts[label] || 0);
  const axisColor = document.body.classList.contains('dark-mode') ? '#fff' : '#000';
  const gridColor = document.body.classList.contains('dark-mode') ? '#333' : '#ddd';

  interestChart = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Applicants',
        data: values,
        backgroundColor: ['#b20710', '#0984e3', '#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#00cec9']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: axisColor,
            precision: 0
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          ticks: {
            color: axisColor
          },
          grid: {
            color: gridColor
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// =============================================================================
// Load and Render Combined Functions
// =============================================================================

async function loadAndRenderHomeStats() {
  // Student quick stats were removed from the public page.
  // Keep this function as a safe no-op because several shared flows await it.
  return;
}

async function loadAndRenderAdminDashboard() {
  const applicants = await apiGet('/api/applicants');
  const metrics = await apiGet('/api/metrics');
  const requests = await apiGet('/api/requests');
  if (applicants && metrics) {
    renderAdminMetrics(applicants, metrics);
    renderEnrollmentFunnel(applicants, metrics);
    renderEngagementPerformance(metrics);
    renderStageRequests(requests);
    renderStageChart(metrics);
    renderEngagementChart(metrics);
    renderZipChart(applicants);
    renderInterestAnalytics(metrics);
  }
}

function renderStageRequests(requests) {
  const panel = document.getElementById('requestPanel');
  if (!panel) return;
  
  if (!requests || requests.length === 0) {
    panel.textContent = 'No pending stage requests.';
    return;
  }
  
  panel.innerHTML = '';
  requests.forEach(req => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<strong>${req.name || req.email}</strong> (${req.email}) requests <em>${req.stageRequest.replace('-', ' ')}</em> from ${req.stage || 'unknown'}`;
    
    const approve = document.createElement('button');
    approve.textContent = 'Approve';
    approve.className = 'btn btn-primary';
    approve.addEventListener('click', async () => {
      const result = await apiPut(`/api/requests/${req.id}`, { action: 'approve' });
      if (result) {
        await loadAndRenderAdminDashboard();
        await loadAndRenderHomeStats();
      }
    });
    
    const deny = document.createElement('button');
    deny.textContent = 'Deny';
    deny.className = 'btn btn-secondary';
    deny.addEventListener('click', async () => {
      const result = await apiPut(`/api/requests/${req.id}`, { action: 'deny' });
      if (result) await loadAndRenderAdminDashboard();
    });
    
    card.appendChild(approve);
    card.appendChild(deny);
    panel.appendChild(card);
  });
}

// Load and render admin users list
async function renderAdminUsers() {
  const adminTable = document.getElementById('adminUsersTable');
  if (!adminTable) return;
  const adminListStatus = document.getElementById('adminListStatus');
  
  const admins = await apiGet('/api/admin-users');
  if (!admins) {
    if (adminListStatus) {
      adminListStatus.textContent = 'Error loading admin users.';
      adminListStatus.style.color = 'crimson';
    }
    return;
  }
  
  const tbody = adminTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  if (admins.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3">No admin accounts found.</td></tr>';
    if (adminListStatus) {
      adminListStatus.textContent = 'No admins found.';
      adminListStatus.style.color = 'inherit';
    }
    return;
  }

  if (adminListStatus) {
    adminListStatus.textContent = `${admins.length} admin account(s).`;
    adminListStatus.style.color = 'inherit';
  }
  
  admins.forEach(admin => {
    const tr = document.createElement('tr');
    
    // Username cell
    const userCell = document.createElement('td');
    userCell.textContent = admin.username;

    // Email cell
    const emailCell = document.createElement('td');
    emailCell.textContent = admin.email || 'Not set';
    
    // Actions cell
    const actionCell = document.createElement('td');
    
    // Reset password button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset Password';
    resetBtn.className = 'btn btn-secondary';
    resetBtn.style.marginRight = '0.5rem';
    resetBtn.addEventListener('click', async () => {
      const newPassword = prompt(`Enter new password for ${admin.username}:`);
      if (newPassword && newPassword.length >= 5) {
        resetBtn.disabled = true;
        const originalResetText = resetBtn.textContent;
        resetBtn.textContent = 'Updating...';
        const result = await apiPut(`/api/admin-users/${admin.id}`, { password: newPassword });

        resetBtn.disabled = false;
        resetBtn.textContent = originalResetText;

        if (result) {
          if (adminListStatus) {
            adminListStatus.textContent = `Password updated successfully for ${admin.username}.`;
            adminListStatus.style.color = 'green';
          }
          await renderAdminUsers();
        } else if (adminListStatus) {
          adminListStatus.textContent = `Failed to update password for ${admin.username}.`;
          adminListStatus.style.color = 'crimson';
        }
      } else if (newPassword) {
        if (adminListStatus) {
          adminListStatus.textContent = 'Password must be at least 5 characters.';
          adminListStatus.style.color = 'crimson';
        }
      }
    });
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.addEventListener('click', async () => {
      if (confirm(`Are you sure you want to delete admin account "${admin.username}"?`)) {
        deleteBtn.disabled = true;
        const originalDeleteText = deleteBtn.textContent;
        deleteBtn.textContent = 'Deleting...';
        const result = await apiDelete(`/api/admin-users/${admin.id}`);

        deleteBtn.disabled = false;
        deleteBtn.textContent = originalDeleteText;

        if (result) {
          if (adminListStatus) {
            adminListStatus.textContent = `Admin account "${admin.username}" deleted.`;
            adminListStatus.style.color = 'green';
          }
          await renderAdminUsers();
        } else {
          if (adminListStatus) {
            adminListStatus.textContent = 'Error: Cannot delete the last admin account.';
            adminListStatus.style.color = 'crimson';
          }
        }
      }
    });
    
    actionCell.appendChild(resetBtn);
    actionCell.appendChild(deleteBtn);
    
    tr.appendChild(userCell);
    tr.appendChild(emailCell);
    tr.appendChild(actionCell);
    tbody.appendChild(tr);
  });
}

// =============================================================================
// Student Portal - init and event handlers
// =============================================================================

async function initHome() {
  if (!document.getElementById('applicationForm')) return;
  
  // Apply saved theme on page load
  applyTheme();
  
  // Setup theme toggle button
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleDarkMode);
  }
  
  // Load initial stats
  await loadAndRenderHomeStats();
  setupFafsaEstimator();
  
  // ZIP eligibility check
  const zipForm = document.getElementById('zipCheckForm');
  if (zipForm) {
    zipForm.addEventListener('submit', event => {
      event.preventDefault();
      const zip = document.getElementById('zipInput').value.trim();
      const resultEl = document.getElementById('zipCheckResult');
      
      if (/^\d{5}$/.test(zip) && allowedForsythZips.has(zip)) {
        resultEl.textContent = 'Great news! Your ZIP is in Forsyth County / Winston-Salem service area.';
        resultEl.style.color = 'green';
      } else {
        resultEl.textContent = 'Sorry, this program is currently limited to Forsyth County/Winston-Salem ZIP codes.';
        resultEl.style.color = 'crimson';
      }
      
      // Track ZIP check on backend
      apiPost('/api/engagement', { action: 'zipCheck' });
    });
  }

  // Resume saved incomplete application by email
  const resumeDraftBtn = document.getElementById('resumeDraftBtn');
  if (resumeDraftBtn) {
    resumeDraftBtn.addEventListener('click', async () => {
      const emailInput = document.getElementById('resumeDraftEmail');
      const statusEl = document.getElementById('resumeDraftStatus');
      const formStatusEl = document.getElementById('formStatus');
      const email = (emailInput?.value || '').trim().toLowerCase();

      if (!email) {
        if (statusEl) {
          statusEl.textContent = 'Please enter your email to load a saved application.';
          statusEl.style.color = 'crimson';
        }
        return;
      }

      if (statusEl) {
        statusEl.textContent = 'Loading saved application...';
        statusEl.style.color = 'inherit';
      }

      const result = await getIncompleteDraftByEmail(email);

      if (!result.success) {
        if (statusEl) {
          statusEl.textContent = result.status === 404
              ? 'No incomplete application was found for that email.'
              : (result.error || 'Could not load your saved application.');
          statusEl.style.color = 'crimson';
        }
        return;
      }

      fillApplicationFormFromDraft(result.data);

      if (statusEl) {
        statusEl.textContent = 'Your saved application has been loaded. Please finish and submit.';
        statusEl.style.color = 'green';
      }
      if (formStatusEl) {
        formStatusEl.textContent = 'Your saved application has been loaded. Please finish and submit.';
        formStatusEl.style.color = 'green';
      }
    });
  }
  
  // Application form submission
  const appForm = document.getElementById('applicationForm');
  if (appForm) {
    appForm.addEventListener('submit', async event => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const zip = (formData.get('zip') || '').trim();
      const isEligible = allowedForsythZips.has(zip);
      
      if (!/^\d{5}$/.test(zip)) {
        const statusEl = document.getElementById('formStatus');
        if (statusEl) {
          statusEl.textContent = 'Please enter a valid 5-digit ZIP code.';
          statusEl.style.color = 'crimson';
        }
        return;
      }
      
      const applicant = {
        name: (formData.get('fullName') || '').trim(),
        // Email is used as the draft key for create-or-update behavior.
        email: (formData.get('email') || '').trim().toLowerCase(),
        phone: (formData.get('phone') || '').trim(),
        school: (formData.get('school') || '').trim(),
        zip,
        gradYear: formData.get('grade'),
        firstGen: formData.get('firstGen'),
        interests: formData.getAll('interests'),
        note: (formData.get('studentMessage') || '').trim(),
        eligible: isEligible,
        applicationStatus: 'submitted',  // FIX: Mark as officially submitted (not draft)
        submittedAt: new Date().toISOString()
      };
      
      const result = await apiPost('/api/applicants', applicant);
      const statusEl = document.getElementById('formStatus');
      
      if (result) {
        const verificationRequired = result.verificationRequired === true;
        const verifyEmailInput = document.getElementById('verifyEmail');
        if (verifyEmailInput) {
          verifyEmailInput.value = applicant.email;
        }

        if (verificationRequired) {
          statusEl.textContent = 'Application submitted successfully! Please check your email for your verification code and confirm your email address.';
        } else if (result.submissionEmailSent === true) {
          statusEl.textContent = 'Your application has been submitted successfully! Please check your email for confirmation and any next steps.';
        } else {
          statusEl.textContent = 'Your application has been submitted successfully! Please watch your email for updates and next steps.';
        }

        if (!isEligible) {
          statusEl.textContent += ' Note: your ZIP is outside the current target area.';
        }

        statusEl.style.color = isEligible ? 'green' : 'orange';

        if (statusEl) {
          statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        appForm.reset();

        if (verificationRequired) {
          const verificationSection = document.getElementById('email-verification');
          if (verificationSection) {
            verificationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }

        await loadAndRenderHomeStats();
      } else {
        statusEl.textContent = 'Error submitting application. Please try again.';
        statusEl.style.color = 'crimson';
      }
    });
  }

  // Save draft button
  const saveDraftBtn = document.getElementById('saveDraft');
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', async event => {
      event.preventDefault();
      const formData = new FormData(document.getElementById('applicationForm'));
      const email = (formData.get('email') || '').trim().toLowerCase();
      const zip = (formData.get('zip') || '').trim();
      
      // Email is required so backend can match/update the same draft record.
      if (!email) {
        const statusEl = document.getElementById('formStatus');
        if (statusEl) {
          statusEl.textContent = 'Please enter your email to save a draft.';
          statusEl.style.color = 'crimson';
        }
        return;
      }
      
      const isEligible = /^\d{5}$/.test(zip) ? allowedForsythZips.has(zip) : false;
      const applicant = {
        name: (formData.get('fullName') || '').trim(),
        email,
        phone: (formData.get('phone') || '').trim(),
        school: (formData.get('school') || '').trim(),
        zip,
        gradYear: formData.get('grade'),
        firstGen: formData.get('firstGen'),
        interests: formData.getAll('interests'),
        note: (formData.get('studentMessage') || '').trim(),
        eligible: isEligible,
        applicationStatus: 'incomplete',
        submittedAt: new Date().toISOString()
      };
      
      const result = await apiPost('/api/applicants', applicant);
      const statusEl = document.getElementById('formStatus');
      
      if (result) {
        statusEl.textContent = 'Draft saved! You can return later to finish your application.';
        statusEl.style.color = 'green';
      } else {
        statusEl.textContent = 'Error saving draft. Please try again.';
        statusEl.style.color = 'crimson';
      }
    });
  }
  
  // Email verification
  const sendVerifyBtn = document.getElementById('sendVerification');
  if (sendVerifyBtn) {
    sendVerifyBtn.addEventListener('click', async () => {
      const email = document.getElementById('verifyEmail').value.trim().toLowerCase();
      const resultEl = document.getElementById('verificationResult');
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        resultEl.textContent = 'Enter a valid email.';
        resultEl.style.color = 'crimson';
        return;
      }
      
      // In real app, backend sends verification email
      const result = await apiPost('/api/verification/send', { email });
      if (result) {
        resultEl.textContent = `Verification code sent to ${email}. Check your inbox (and spam folder).`;
        resultEl.style.color = 'green';
      } else {
        resultEl.textContent = 'Could not send verification. Try again.';
        resultEl.style.color = 'crimson';
      }
    });
  }
  
  const confirmVerifyBtn = document.getElementById('confirmVerification');
  if (confirmVerifyBtn) {
    confirmVerifyBtn.addEventListener('click', async () => {
      const email = document.getElementById('verifyEmail').value.trim().toLowerCase();
      const code = document.getElementById('verifyCode').value.trim();
      const resultEl = document.getElementById('verificationResult');
      
      if (!email || !code) {
        resultEl.textContent = 'Provide email and verification code.';
        resultEl.style.color = 'crimson';
        return;
      }
      
      const result = await apiPost('/api/verification/confirm', { email, code });
      if (result && result.success) {
        resultEl.textContent = 'Email verified successfully!';
        resultEl.style.color = 'green';
      } else {
        resultEl.textContent = 'Verification failed. Check your code and try again.';
        resultEl.style.color = 'crimson';
      }
    });
  }
  
}

// =============================================================================
// Admin Login Management - Token-based for reliability
// =============================================================================

function getAdminToken() {
  return sessionStorage.getItem('adminToken');
}

function getAdminUsername() {
  return sessionStorage.getItem('adminUsername');
}

function setAdminSession(token, username) {
  sessionStorage.setItem('adminToken', token);
  sessionStorage.setItem('adminUsername', username);
}

function clearAdminSession() {
  sessionStorage.removeItem('adminToken');
  sessionStorage.removeItem('adminUsername');
}

function isAdminLoggedIn() {
  return !!getAdminToken();
}

// Check session validity with backend
async function checkAdminSession() {
  const token = getAdminToken();
  if (!token) return { success: false };

  try {
    const response = await fetch(API_BASE + '/api/admin-session', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();
    if (data.success) {
      // Keep local username in sync with backend
      const username = data.username || getAdminUsername();
      setAdminSession(token, username);
      return { success: true, username };
    }
  } catch (error) {
    console.error('Session check failed:', error);
  }

  return { success: false };
}

// Handle unauthorized responses by clearing session and redirecting to login
function handleUnauthorized() {
  clearAdminSession();
  showLoginForm();
  const loginStatus = document.getElementById('loginStatus');
  if (loginStatus) {
    loginStatus.textContent = 'Session expired. Please log in again.';
    loginStatus.style.color = 'orange';
  }
}

function showLoginForm() {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (loginSection) loginSection.style.display = 'block';
  if (dashboardSection) dashboardSection.style.display = 'none';
  if (logoutBtn) logoutBtn.style.display = 'none';
  updateWelcomeMessage(null);
}

function showDashboard() {
  const loginSection = document.getElementById('loginSection');
  const dashboardSection = document.getElementById('dashboardSection');
  const logoutBtn = document.getElementById('logoutBtn');
  
  if (loginSection) loginSection.style.display = 'none';
  if (dashboardSection) dashboardSection.style.display = 'block';
  if (logoutBtn) logoutBtn.style.display = 'inline-block';
}

function setupLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const loginStatus = document.getElementById('loginStatus');
  
  if (!loginForm) return;
  if (loginForm.dataset.bound === '1') return;
  loginForm.dataset.bound = '1';
  
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    
    if (!username || !password) {
      if (loginStatus) {
        loginStatus.textContent = 'Please enter username and password.';
        loginStatus.style.color = 'crimson';
      }
      return;
    }

    // Clear any previous status
    if (loginStatus) {
      loginStatus.textContent = 'Logging in...';
      loginStatus.style.color = 'blue';
    }
    
    // Call backend login API
    const result = await apiPost('/api/login', { username, password });
    
    if (result && result.success) {
      // Store token and username
      setAdminSession(result.token, result.username);
      showDashboard();
      updateWelcomeMessage(result.username);
      await loadAndRenderAdminDashboard();
      setupDashboardHandlers();
      
      if (loginStatus) {
        loginStatus.textContent = '';
      }
    } else {
      // Show specific error message from backend
      const errorMsg = result && result.error ? result.error : 'Login failed. Please try again.';
      if (loginStatus) {
        loginStatus.textContent = errorMsg;
        loginStatus.style.color = 'crimson';
      }
    }
  });
}

function setupPasswordResetForms() {
  const loginStatus = document.getElementById('loginStatus');
  const showForgotBtn = document.getElementById('showForgotPassword');
  const forgotPanel = document.getElementById('forgotPasswordPanel');
  const resetPanel = document.getElementById('resetPasswordPanel');
  const forgotForm = document.getElementById('forgotPasswordForm');
  const resetForm = document.getElementById('resetPasswordForm');

  if (showForgotBtn && showForgotBtn.dataset.bound === '1') {
    return;
  }
  if (showForgotBtn) {
    showForgotBtn.dataset.bound = '1';
  }

  if (showForgotBtn && forgotPanel && resetPanel) {
    showForgotBtn.addEventListener('click', () => {
      forgotPanel.style.display = 'block';
      resetPanel.style.display = 'block';
      if (loginStatus) {
        loginStatus.textContent = '';
      }

      const loginUsername = document.getElementById('adminUsername');
      const forgotUsername = document.getElementById('forgotUsername');
      const resetUsername = document.getElementById('resetUsername');
      const copiedUsername = loginUsername && loginUsername.value ? loginUsername.value.trim() : '';
      if (copiedUsername) {
        if (forgotUsername) forgotUsername.value = copiedUsername;
        if (resetUsername) resetUsername.value = copiedUsername;
      }
    });
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = (document.getElementById('forgotUsername')?.value || '').trim();
      const sendResetBtn = forgotForm.querySelector('button[type="submit"]');

      if (!username) {
        if (loginStatus) {
          loginStatus.textContent = 'Please enter a username.';
          loginStatus.style.color = 'crimson';
        }
        return;
      }

      if (loginStatus) {
        loginStatus.textContent = 'Sending reset code...';
        loginStatus.style.color = 'blue';
      }

      if (sendResetBtn) {
        sendResetBtn.disabled = true;
        sendResetBtn.dataset.originalText = sendResetBtn.textContent;
        sendResetBtn.textContent = 'Sending...';
      }

      const result = await apiPost('/api/admin-forgot-password', { username });

      if (sendResetBtn) {
        sendResetBtn.disabled = false;
        sendResetBtn.textContent = sendResetBtn.dataset.originalText || 'Send Reset Code';
      }

      if (loginStatus) {
        loginStatus.textContent = result && result.message
          ? result.message
          : 'If that account exists, a reset email has been sent.';
        loginStatus.style.color = 'green';
      }
    });
  }

  if (resetForm) {
    resetForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = (document.getElementById('resetUsername')?.value || '').trim();
      const resetCode = (document.getElementById('resetCode')?.value || '').trim();
      const newPassword = document.getElementById('resetNewPassword')?.value || '';

      if (!username || !resetCode || !newPassword) {
        if (loginStatus) {
          loginStatus.textContent = 'Please complete username, reset code, and new password.';
          loginStatus.style.color = 'crimson';
        }
        return;
      }

      if (newPassword.length < 8) {
        if (loginStatus) {
          loginStatus.textContent = 'New password must be at least 8 characters.';
          loginStatus.style.color = 'crimson';
        }
        return;
      }

      if (loginStatus) {
        loginStatus.textContent = 'Resetting password...';
        loginStatus.style.color = 'blue';
      }

      const result = await apiPost('/api/admin-reset-password', { username, resetCode, newPassword });
      if (result && result.success) {
        if (loginStatus) {
          loginStatus.textContent = result.message || 'Password reset successful. Please log in.';
          loginStatus.style.color = 'green';
        }
        resetForm.reset();
        const adminPassword = document.getElementById('adminPassword');
        if (adminPassword) {
          adminPassword.focus();
        }
      } else {
        if (loginStatus) {
          loginStatus.textContent = 'Reset failed. Check your username, reset code, and password requirements.';
          loginStatus.style.color = 'crimson';
        }
      }
    });
  }
}

function setupLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      // Call backend logout
      const token = getAdminToken();
      if (token) {
        try {
          await fetch(API_BASE + '/api/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (error) {
          console.error('Logout API call failed:', error);
        }
      }

      // Clear local session
      clearAdminSession();
      showLoginForm();
      document.getElementById('loginForm').reset();
      const loginStatus = document.getElementById('loginStatus');
      if (loginStatus) {
        loginStatus.textContent = '';
      }
    });
  }
}

// =============================================================================
// Admin Dashboard - init and event handlers
// =============================================================================

async function initAdmin() {
  if (!document.getElementById('filterForm')) return;

  // Apply saved theme and setup toggle on admin page.
  applyTheme();
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleDarkMode);
  }

  setupLoginForm();
  setupPasswordResetForms();
  
  // Check session validity with backend
  const sessionData = await checkAdminSession();
  
  if (!sessionData.success) {
    // Clear any stale session data
    clearAdminSession();
    showLoginForm();
    return;
  }
  
  // Session is valid, show dashboard and set welcome text
  showDashboard();
  setupLogoutButton();
  updateWelcomeMessage(sessionData.username || getAdminUsername());
  
  // Load initial admin data
  await loadAndRenderAdminDashboard();
  await renderAdminUsers(); // Load admin users list
  setupDashboardHandlers();
  setupEditModalHandlers(); // Setup edit modal handlers
  setupAdminManagement(); // Setup admin management handlers
}

// =============================================================================
// Edit Applicant Modal
// =============================================================================

// Store current applicant being edited
let currentEditingApplicant = null;

function openEditModal(applicant) {
  currentEditingApplicant = applicant;

  // Populate form fields with current applicant data
  document.getElementById('editName').value = applicant.name || '';
  document.getElementById('editEmail').value = applicant.email || '';
  document.getElementById('editPhone').value = applicant.phone || '';
  document.getElementById('editSchool').value = applicant.school || '';
  document.getElementById('editZip').value = applicant.zip || '';
  document.getElementById('editGradYear').value = applicant.gradYear || '';
  document.getElementById('editFirstGen').value = applicant.firstGen || '';
  document.getElementById('editEligible').value = applicant.eligible ? '1' : '0';
  document.getElementById('editApplicationStatus').value = applicant.applicationStatus || 'submitted';
  document.getElementById('editNote').value = applicant.note || '';

  // Show the modal
  document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
  currentEditingApplicant = null;
}

// Setup modal event listeners
function setupEditModalHandlers() {
  const editModal = document.getElementById('editModal');
  if (!editModal) return; // Modal not on this page

  const saveBtn = document.getElementById('editSaveBtn');
  const cancelBtn = document.getElementById('editCancelBtn');

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (!currentEditingApplicant) return;

      // Gather updated field values from form
      const updatedData = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        school: document.getElementById('editSchool').value,
        zip: document.getElementById('editZip').value,
        gradYear: parseInt(document.getElementById('editGradYear').value, 10) || null,
        firstGen: document.getElementById('editFirstGen').value || null,
        eligible: parseInt(document.getElementById('editEligible').value, 10),
        applicationStatus: document.getElementById('editApplicationStatus').value,
        note: document.getElementById('editNote').value
      };

      // Send PUT request to update applicant
      const result = await apiPut(`/api/applicants/${currentEditingApplicant.id}`, updatedData);
      if (result) {
        alert('Applicant updated successfully.');
        closeEditModal();
        await loadAndRenderAdminDashboard();
        await loadAndRenderHomeStats();
      } else {
        alert('Failed to update applicant. Try again.');
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      closeEditModal();
    });
  }

  // Close modal if user clicks outside the form
  if (editModal) {
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) {
        closeEditModal();
      }
    });
  }
}

function setupDashboardHandlers() {
  const filterForm = document.getElementById('filterForm');
  if (filterForm) {
    filterForm.addEventListener('submit', async event => {
      event.preventDefault();
      
      const name = document.getElementById('searchName').value.trim().toLowerCase();
      const zip = document.getElementById('filterZip').value.trim();
      const interest = document.getElementById('filterInterest').value;
      const applicationStatus = document.getElementById('filterApplicationStatus').value;
      
      let applicants = await apiGet('/api/applicants');
      if (!applicants) return;
      
      // Filter on frontend after fetching from backend
      if (name) applicants = applicants.filter(a => a.name.toLowerCase().includes(name));
      if (zip) applicants = applicants.filter(a => a.zip === zip);
      if (interest) {
        applicants = applicants.filter(a => normalizeInterests(a.interests).includes(interest));
      }
      if (applicationStatus) {
        applicants = applicants.filter(a => getApplicationStatus(a) === applicationStatus);
      }

      currentAdminApplicantsForExport = applicants.slice();
      
      const tbody = document.querySelector('#applicantTable tbody');
      if (tbody) {
        tbody.innerHTML = '';

        if (!applicants.length) {
          tbody.innerHTML = '<tr><td colspan="11">No applications match the current filters.</td></tr>';
        }

        applicants.forEach(app => {
          const interestList = normalizeInterests(app.interests);
          const appStatus = getApplicationStatus(app);
          const tr = document.createElement('tr');
          if (appStatus === 'incomplete') {
            tr.style.background = 'rgba(178, 7, 16, 0.08)';
          }
          
          // Basic info columns
          tr.innerHTML = `
            <td>${app.name}</td>
            <td>${app.email}</td>
            <td>${app.phone || '-'}</td>
            <td>${app.school}</td>
            <td>${app.zip}</td>
            <td>${app.firstGen || '-'}</td>
            <td>${interestList.join(', ') || '-'}</td>
            <td>${app.stage || 'submitted'}</td>
            <td>${app.eligible ? 'Eligible' : 'Out-of-area'}</td>
            <td><span class="badge" style="${appStatus === 'incomplete' ? 'background:#b20710;color:#fff;' : ''}">${appStatus}</span></td>
          `;
          
          // Action cell: single horizontal flex row
          // [ dropdown ] [ Move ] [ Edit ] [ Delete ]
          const actionTd = document.createElement('td');
          actionTd.style.cssText = 'white-space:nowrap;';

          const stageSelect = document.createElement('select');
          stageSelect.style.minWidth = '110px';
          ['submitted', 'under-review', 'accepted', 'enrolled'].forEach(stage => {
            const option = document.createElement('option');
            option.value = stage;
            option.textContent = stage.replace('-', ' ');
            if (app.stage === stage) option.selected = true;
            stageSelect.appendChild(option);
          });

          const moveBtn = document.createElement('button');
          moveBtn.textContent = 'Move';
          moveBtn.className = 'btn btn-secondary';
          moveBtn.addEventListener('click', async () => {
            const newStage = stageSelect.value;
            const result = await apiPut(`/api/applicants/${app.id}`, { stage: newStage });
            if (result) {
              app.stage = newStage;
              await loadAndRenderAdminDashboard();
              await loadAndRenderHomeStats();
            }
          });

          const editBtn = document.createElement('button');
          editBtn.textContent = 'Edit';
          editBtn.className = 'btn btn-primary';
          editBtn.addEventListener('click', () => {
            openEditModal(app);
          });

          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = 'Delete';
          deleteBtn.className = 'btn btn-danger';
          deleteBtn.addEventListener('click', async () => {
            const confirmed = confirm(`Are you sure you want to delete ${app.name} (${app.email})? This cannot be undone.`);
            if (!confirmed) return;

            const result = await apiDelete(`/api/applicants/${app.id}`);
            if (result) {
              alert(`${app.name} has been deleted.`);
              await loadAndRenderAdminDashboard();
              await loadAndRenderHomeStats();
            } else {
              alert('Failed to delete applicant. Try again.');
            }
          });

          const actionWrapper = document.createElement('div');
          actionWrapper.style.cssText = 'display:flex; align-items:center; gap:8px; flex-wrap:nowrap;';
          actionWrapper.appendChild(stageSelect);
          actionWrapper.appendChild(moveBtn);
          actionWrapper.appendChild(editBtn);
          actionWrapper.appendChild(deleteBtn);

          actionTd.appendChild(actionWrapper);
          tr.appendChild(actionTd);
          
          tbody.appendChild(tr);
        });
      }
      
      document.getElementById('filterStatus').textContent = `${applicants.length} applicant(s) after filtering.`;
      renderIncompleteFollowUp(applicants);
      renderGeoViz(applicants);
    });
  }
  
  // Clear filters
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      document.getElementById('searchName').value = '';
      document.getElementById('filterZip').value = '';
      document.getElementById('filterInterest').value = '';
      document.getElementById('filterApplicationStatus').value = '';
      document.getElementById('filterStatus').textContent = 'Filters cleared.';
      await loadAndRenderAdminDashboard();
    });
  }

  // Export current applicants as CSV (filtered list when filters are active).
  const exportBtn = document.getElementById('exportApplicantsCsv');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      const statusEl = document.getElementById('exportStatus');
      let applicantsToExport = currentAdminApplicantsForExport;

      if (!Array.isArray(applicantsToExport) || applicantsToExport.length === 0) {
        const fetched = await apiGet('/api/applicants');
        applicantsToExport = Array.isArray(fetched) ? fetched : [];
      }

      if (!applicantsToExport.length) {
        if (statusEl) {
          statusEl.textContent = 'No applicants available to export.';
          statusEl.style.color = 'crimson';
        }
        return;
      }

      downloadApplicantsCsv(applicantsToExport);
      if (statusEl) {
        statusEl.textContent = 'Applicant CSV downloaded.';
        statusEl.style.color = 'green';
      }
    });
  }
  
  // Run campaign
  const campaignBtn = document.getElementById('runCampaign');
  if (campaignBtn) {
    campaignBtn.addEventListener('click', async () => {
      const campaign = document.getElementById('campaignName').value.trim();
      const message = document.getElementById('campaignMessage').value.trim();
      
      if (!campaign || !message) {
        document.getElementById('campaignResult').textContent = 'Provide campaign name and message.';
        return;
      }
      
      const result = await apiPost('/api/campaigns/run', { campaign, message });
      const resultEl = document.getElementById('campaignResult');
      
      if (result) {
        const successCount = result.successCount ?? result.count ?? 0;
        const failedCount = result.failedCount ?? 0;
        resultEl.textContent = failedCount > 0
          ? `Campaign "${campaign}" sent to ${successCount} recipient(s). Failed: ${failedCount}.`
          : `Campaign "${campaign}" sent to ${successCount} recipient(s).`;
        resultEl.style.color = 'green';
        await loadAndRenderAdminDashboard();
      } else {
        resultEl.textContent = 'Error running campaign.';
        resultEl.style.color = 'crimson';
      }
    });
  }

  // Send reminders only to incomplete applications
  const incompleteReminderBtn = document.getElementById('sendIncompleteReminder');
  if (incompleteReminderBtn) {
    incompleteReminderBtn.addEventListener('click', async () => {
      if (incompleteReminderBtn.disabled) return;

      const statusEl = document.getElementById('incompleteReminderStatus');
      const originalLabel = incompleteReminderBtn.textContent;

      incompleteReminderBtn.disabled = true;
      incompleteReminderBtn.textContent = 'Sending...';

      if (statusEl) {
        statusEl.textContent = 'Sending reminders...';
        statusEl.style.color = 'inherit';
      }

      const result = await apiPost('/api/reminders/incomplete', {});
      console.log('Incomplete reminder response:', result);

      incompleteReminderBtn.disabled = false;
      incompleteReminderBtn.textContent = originalLabel;

      if (statusEl) {
        if (!result) {
          statusEl.textContent = 'Failed to send incomplete reminders.';
          statusEl.style.color = 'crimson';
        } else {
          const successCount = result.successCount ?? 0;
          const failedCount = result.failedCount ?? 0;
          const attempted = result.attempted ?? (successCount + failedCount);

          if (failedCount > 0) {
            statusEl.textContent = `Reminders attempted: ${attempted}. Sent: ${successCount}. Failed: ${failedCount}.`;
            statusEl.style.color = 'orange';
          } else {
            statusEl.textContent = `Reminders attempted: ${attempted}. Sent: ${successCount}. Failed: 0.`;
            statusEl.style.color = 'green';
          }
        }
      }

      await loadAndRenderAdminDashboard();
    });
  }
  
  // Reset data (backend dependent)
  const resetBtn = document.getElementById('resetData');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (!confirm('Clear all applicant and engagement data?')) return;
      
      // TODO: Implement backend reset endpoint if needed
      // For now, just log that feature depends on backend:
      console.log('Reset data button clicked. Backend reset endpoint not yet implemented.');
      alert('Reset endpoint not configured. Contact administrator.');
    });
  }
}

// Setup admin user management handlers
function setupAdminManagement() {
  // Handle create admin form submission
  const createAdminForm = document.getElementById('createAdminForm');
  const createAdminStatus = document.getElementById('createAdminStatus');
  
  if (!createAdminForm) return;
  
  createAdminForm.addEventListener('submit', async event => {
    event.preventDefault();
    
    const username = (document.getElementById('newAdminUsername')?.value || '').trim();
    const email = (document.getElementById('newAdminEmail')?.value || '').trim().toLowerCase();
    const password = (document.getElementById('newAdminPassword')?.value || '').trim();
    console.log({ username, email, password });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!username || !email || !password) {
      createAdminStatus.textContent = 'Please enter username, email, and password.';
      createAdminStatus.style.color = 'crimson';
      return;
    }

    if (!emailRegex.test(email)) {
      createAdminStatus.textContent = 'Please enter a valid email address.';
      createAdminStatus.style.color = 'crimson';
      return;
    }

    const createBtn = createAdminForm.querySelector('button[type="submit"]');
    if (createBtn) {
      createBtn.disabled = true;
      createBtn.dataset.originalText = createBtn.textContent;
      createBtn.textContent = 'Processing...';
    }
    
    // Call backend to create new admin
    const result = await apiPost('/api/admin-users', { username, email, password });

    if (createBtn) {
      createBtn.disabled = false;
      createBtn.textContent = createBtn.dataset.originalText || 'Create Admin';
    }
    
    if (result && result.success) {
      createAdminStatus.textContent = `Admin account "${username}" created successfully.`;
      createAdminStatus.style.color = 'green';
      createAdminForm.reset();
      await renderAdminUsers(); // Refresh admin list
    } else if (result && result.error) {
      createAdminStatus.textContent = `Error: ${result.error}`;
      createAdminStatus.style.color = 'crimson';
    } else {
      createAdminStatus.textContent = 'Error creating admin account. Try again.';
      createAdminStatus.style.color = 'crimson';
    }
  });
}

// =============================================================================
// Initialization on page load
// =============================================================================

window.addEventListener('DOMContentLoaded', async () => {
  await initHome();
  await initAdmin();
  setupLogoutButton(); // Setup logout handler even if not logged in

  // Animate .fade-in elements as they scroll into view
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    fadeEls.forEach(el => observer.observe(el));
  } else {
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  const carousel = document.querySelector('.testimonial-carousel');
  if (carousel) {
    const track = carousel.querySelector('.testimonial-track');
    const cards = Array.from(carousel.querySelectorAll('.testimonial-card'));
    const prevBtn = carousel.querySelector('.testimonial-prev');
    const nextBtn = carousel.querySelector('.testimonial-next');
    let currentIndex = 0;

    const getCardsPerView = () => {
      if (window.innerWidth >= 1100) return 3;
      if (window.innerWidth >= 760) return 2;
      return 1;
    };

    const getMaxIndex = () => Math.max(0, cards.length - getCardsPerView());

    const updateCarousel = () => {
      currentIndex = Math.min(currentIndex, getMaxIndex());
      const targetCard = cards[currentIndex];
      const offset = targetCard ? targetCard.offsetLeft : 0;
      track.style.transform = `translateX(-${offset}px)`;
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex >= getMaxIndex();
    };

    prevBtn.addEventListener('click', () => {
      currentIndex = Math.max(0, currentIndex - 1);
      updateCarousel();
    });

    nextBtn.addEventListener('click', () => {
      currentIndex = Math.min(getMaxIndex(), currentIndex + 1);
      updateCarousel();
    });

    window.addEventListener('resize', updateCarousel);
    updateCarousel();
  }
});