// Environment and core dependencies
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const db = require('./config/sqliteConn');
const bodyParser = require('body-parser');
const path = require('path');
const ejs = require('ejs');
const expressLayouts = require('express-ejs-layouts');

// Initialize application
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// CONFIGURATION
// ============================================================================

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'view'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'timemanagementappsecret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day default
  }
}));

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format time in HH:MM format
 * @param {Date} date - Date object
 * @returns {string} Formatted time string (HH:MM)
 */
const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Calculate time difference in minutes
 * @param {string} startTime - Start time in HH:MM format
 * @param {string} endTime - End time in HH:MM format
 * @returns {number} Difference in minutes
 */
const calculateTimeDiff = (startTime, endTime) => {
  const start = new Date(`2025-03-21T${startTime}`);
  const end = new Date(`2025-03-21T${endTime}`);
  return Math.round((end - start) / (1000 * 60));
};

/**
 * Format minutes as HH:MM
 * @param {number} minutes - Total minutes
 * @returns {string} Formatted time string (HH:MM)
 */
const formatMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
};

// ============================================================================
// DATABASE MOCKS
// ============================================================================

// Mock users database (in a real app, you'd use a proper database)
const users = [
  { 
    id: 1, 
    username: 'admin', 
    password: 'password123', // In a real app, this would be hashed
    name: 'Administrator',
    role: 'admin'
  },
  { 
    id: 2, 
    username: 'user', 
    password: 'userpass', 
    name: 'Regular User',
    role: 'user'
  }
];

// Mock data storage for time tracking
const timeEntries = {
  currentDay: null,
  entries: [
    { date: '2025-03-21', login: '08:30', logout: '17:30', pause: '01:00', unavailable: '00:00', totalAvailable: '08:00', status: 'complete' },
    { date: '2025-03-20', login: '08:45', logout: '17:45', pause: '01:00', unavailable: '00:30', totalAvailable: '07:30', status: 'complete' }
  ],
  activeEntry: null
};

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Authentication middleware
app.use((req, res, next) => {
  // Make authentication status available to all views
  res.locals.isAuthenticated = req.session.isAuthenticated || false;
  res.locals.user = req.session.user || null;
  next();
});

// Middleware to check if user is logged in
const checkAuth = (req, res, next) => {
  if (!req.session.isAuthenticated) {
    return res.redirect('/login?error=Please log in to access this page');
  }
  next();
};

// Admin authorization middleware
const checkAdmin = (req, res, next) => {
  if (!req.session.isAuthenticated || req.session.user.role !== 'admin') {
    return res.status(403).render('error', { 
      message: 'Access denied. Admin privileges required.',
      activePage: 'error'
    });
  }
  next();
};

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Show login page
app.get('/login', (req, res) => {
  // If already logged in, redirect to dashboard
  if (req.session.isAuthenticated) {
    return res.redirect('/dashboard');
  }
  
  res.render('login', { 
    activePage: 'login',
    error: req.query.error
  });
});

// Handle login form submission
app.post('/login', (req, res) => {
  const { username, password, remember } = req.body;
  
  // Find user in database
  const user = users.find(u => u.username === username && u.password === password);
  
  // Check credentials
  if (!user) {
    return res.render('login', { 
      error: 'Invalid username or password', 
      activePage: 'login' 
    });
  }
  
  // Set session variables
  req.session.isAuthenticated = true;
  req.session.user = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  };
  
  // If remember me checkbox is checked, extend session lifetime
  if (remember) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  }
  
  // Redirect to dashboard
  res.redirect('/dashboard');
});

// Handle logout
app.get('/logout', (req, res) => {
  // Destroy session
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

// ============================================================================
// PAGE ROUTES
// ============================================================================

// Root route without forced redirection for authenticated users
app.get('/', (req, res) => {
  // Render the index page regardless of authentication status
  // This lets logged-in users still see the homepage when they click Home
  res.render('index', { 
    activePage: 'home'
  });
});

// Contact us page
app.get('/contact', (req, res) => {
  res.render('contact', { activePage: 'contact' });
});

// Profile route (protected)
app.get('/profile', checkAuth, (req, res) => {
  res.render('profile', { 
    user: req.session.user, 
    activePage: 'profile'
  });
});

// Apply leave page (protected)
app.get('/apply-leave', checkAuth, (req, res) => {
  // Mock data
  const leaveData = {
    totalQuota: 25,
    usedLeaves: 15
  };
  res.render('apply-leave', { 
    leaveData, 
    activePage: 'apply-leave' 
  });
});

// Leave request form (protected)
app.get('/leave-request', checkAuth, (req, res) => {
  // Mock user data
  const userData = {
    employeeId: 'EMP123',
    name: req.session.user.name,
    email: `${req.session.user.username}@example.com`
  };
  res.render('leave-request', { 
    userData, 
    activePage: 'leave-request' 
  });
});

// Import routes
const adminRoutes = require('./routes/admin');

// Make the middleware available to the admin routes
app.use((req, res, next) => {
  req.checkAdmin = checkAdmin;
  req.checkAuth = checkAuth;
  next();
});

// Use admin routes
app.use('/admin', adminRoutes);

// ============================================================================
// TIMESHEET ROUTES
// ============================================================================

// Dashboard route (protected)
app.get('/dashboard', checkAuth, (req, res) => {
  const now = new Date();
  
  // Get summary data for the dashboard
  let remainingHours = 0;
  
  if (timeEntries.activeEntry) {
    // Calculate remaining hours
    const loginTime = timeEntries.activeEntry.login;
    const elapsedMinutes = calculateTimeDiff(loginTime, formatTime(now));
    
    let pauseMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.pause);
    let unavailableMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.unavailable);
    
    if (timeEntries.activeEntry.pauseStart) {
      pauseMinutes += calculateTimeDiff(timeEntries.activeEntry.pauseStart, formatTime(now));
    }
    
    if (timeEntries.activeEntry.unavailableStart) {
      unavailableMinutes += calculateTimeDiff(timeEntries.activeEntry.unavailableStart, formatTime(now));
    }
    
    const workedMinutes = elapsedMinutes - (pauseMinutes + unavailableMinutes);
    remainingHours = (480 - workedMinutes) / 60; // Assuming 8-hour workday (480 minutes)
    if (remainingHours < 0) remainingHours = 0;
  }
  
  const dashboardData = {
    activeEntry: timeEntries.activeEntry,
    remainingHours: remainingHours.toFixed(1),
    recentEntries: timeEntries.entries.slice(0, 3) // Latest 3 entries
  };
  
  res.render('dashboard', { 
    ...dashboardData,
    activePage: 'dashboard'
  });
});

// Timesheet page (protected)
app.get('/timesheet', checkAuth, (req, res) => {
  const now = new Date();
  
  // Check for active entry and calculate remaining hours
  let loginTime = '---';
  let remainingHours = 0;
  
  if (timeEntries.activeEntry) {
    loginTime = timeEntries.activeEntry.login;
    
    // Calculate elapsed time in minutes
    const elapsedMinutes = calculateTimeDiff(loginTime, formatTime(now));
    
    // Calculate pause and unavailable time
    let pauseMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.pause);
    let unavailableMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.unavailable);
    
    // Add current pause if on break
    if (timeEntries.activeEntry.pauseStart) {
      pauseMinutes += calculateTimeDiff(timeEntries.activeEntry.pauseStart, formatTime(now));
    }
    
    // Add current unavailable if unavailable
    if (timeEntries.activeEntry.unavailableStart) {
      unavailableMinutes += calculateTimeDiff(timeEntries.activeEntry.unavailableStart, formatTime(now));
    }
    
    // Calculate worked time
    const workedMinutes = elapsedMinutes - (pauseMinutes + unavailableMinutes);
    
    // 8-hour workday = 480 minutes
    remainingHours = (480 - workedMinutes) / 60;
    if (remainingHours < 0) remainingHours = 0;
  }
  
  const timesheetData = {
    loginTime: loginTime,
    remainingHours: remainingHours,
    timeEntries: timeEntries.entries,
    activeEntry: timeEntries.activeEntry
  };
  
  res.render('timesheet', { 
    timesheetData, 
    activePage: 'timesheet' 
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Get timesheet status
app.get('/api/timesheet-status', checkAuth, (req, res) => {
  res.json({
    activeEntry: timeEntries.activeEntry,
    entries: timeEntries.entries.slice(0, 10) // Return last 10 entries
  });
});

// Clock in route
app.post('/api/clock-in', checkAuth, (req, res) => {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // Check if already clocked in today
  const existingEntry = timeEntries.entries.find(entry => entry.date === today);
  
  if (existingEntry && existingEntry.status !== 'complete') {
    return res.status(400).json({ error: 'Already clocked in today' });
  }
  
  const currentTime = formatTime(now);
  
  const newEntry = {
    date: today,
    login: currentTime,
    logout: '',
    pause: '00:00',
    unavailable: '00:00',
    totalAvailable: '00:00',
    status: 'active',
    pauseStart: null,
    unavailableStart: null
  };
  
  timeEntries.entries.unshift(newEntry);
  timeEntries.activeEntry = newEntry;
  timeEntries.currentDay = today;
  
  res.json({ success: true, entry: newEntry });
});

// Clock out route
app.post('/api/clock-out', checkAuth, (req, res) => {
  if (!timeEntries.activeEntry || timeEntries.activeEntry.status !== 'active') {
    return res.status(400).json({ error: 'Not clocked in' });
  }
  
  const now = new Date();
  const currentTime = formatTime(now);
  
  // If there's an active pause or unavailable period, end it
  if (timeEntries.activeEntry.pauseStart) {
    const pauseMinutes = calculateTimeDiff(timeEntries.activeEntry.pauseStart, currentTime);
    const currentPauseMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.pause);
    timeEntries.activeEntry.pause = formatMinutes(currentPauseMinutes + pauseMinutes);
    timeEntries.activeEntry.pauseStart = null;
  }
  
  if (timeEntries.activeEntry.unavailableStart) {
    const unavailableMinutes = calculateTimeDiff(timeEntries.activeEntry.unavailableStart, currentTime);
    const currentUnavailableMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.unavailable);
    timeEntries.activeEntry.unavailable = formatMinutes(currentUnavailableMinutes + unavailableMinutes);
    timeEntries.activeEntry.unavailableStart = null;
  }
  
  // Calculate total available time
  const loginMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.login);
  const logoutMinutes = calculateTimeDiff('00:00', currentTime);
  const pauseMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.pause);
  const unavailableMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.unavailable);
  
  const totalAvailableMinutes = (logoutMinutes - loginMinutes) - (pauseMinutes + unavailableMinutes);
  
  timeEntries.activeEntry.logout = currentTime;
  timeEntries.activeEntry.totalAvailable = formatMinutes(totalAvailableMinutes);
  timeEntries.activeEntry.status = 'complete';
  timeEntries.activeEntry = null;
  
  res.json({ success: true });
});

// Start break route
app.post('/api/start-break', checkAuth, (req, res) => {
  if (!timeEntries.activeEntry || timeEntries.activeEntry.status !== 'active') {
    return res.status(400).json({ error: 'Not clocked in' });
  }
  
  // If already on break
  if (timeEntries.activeEntry.pauseStart) {
    return res.status(400).json({ error: 'Already on break' });
  }
  
  // If unavailable, end that first
  if (timeEntries.activeEntry.unavailableStart) {
    const now = new Date();
    const currentTime = formatTime(now);
    
    const unavailableMinutes = calculateTimeDiff(timeEntries.activeEntry.unavailableStart, currentTime);
    const currentUnavailableMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.unavailable);
    timeEntries.activeEntry.unavailable = formatMinutes(currentUnavailableMinutes + unavailableMinutes);
    timeEntries.activeEntry.unavailableStart = null;
  }
  
  const now = new Date();
  timeEntries.activeEntry.pauseStart = formatTime(now);
  
  res.json({ success: true });
});

// End break route
app.post('/api/end-break', checkAuth, (req, res) => {
  if (!timeEntries.activeEntry || !timeEntries.activeEntry.pauseStart) {
    return res.status(400).json({ error: 'Not on break' });
  }
  
  const now = new Date();
  const currentTime = formatTime(now);
  
  const pauseMinutes = calculateTimeDiff(timeEntries.activeEntry.pauseStart, currentTime);
  const currentPauseMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.pause);
  
  timeEntries.activeEntry.pause = formatMinutes(currentPauseMinutes + pauseMinutes);
  timeEntries.activeEntry.pauseStart = null;
  
  res.json({ success: true });
});

// Start unavailable route
app.post('/api/start-unavailable', checkAuth, (req, res) => {
  if (!timeEntries.activeEntry || timeEntries.activeEntry.status !== 'active') {
    return res.status(400).json({ error: 'Not clocked in' });
  }
  
  // If already unavailable
  if (timeEntries.activeEntry.unavailableStart) {
    return res.status(400).json({ error: 'Already unavailable' });
  }
  
  // If on break, end that first
  if (timeEntries.activeEntry.pauseStart) {
    const now = new Date();
    const currentTime = formatTime(now);
    
    const pauseMinutes = calculateTimeDiff(timeEntries.activeEntry.pauseStart, currentTime);
    const currentPauseMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.pause);
    timeEntries.activeEntry.pause = formatMinutes(currentPauseMinutes + pauseMinutes);
    timeEntries.activeEntry.pauseStart = null;
  }
  
  const now = new Date();
  timeEntries.activeEntry.unavailableStart = formatTime(now);
  
  res.json({ success: true });
});

// End unavailable route
app.post('/api/end-unavailable', checkAuth, (req, res) => {
  if (!timeEntries.activeEntry || !timeEntries.activeEntry.unavailableStart) {
    return res.status(400).json({ error: 'Not unavailable' });
  }
  
  const now = new Date();
  const currentTime = formatTime(now);
  
  const unavailableMinutes = calculateTimeDiff(timeEntries.activeEntry.unavailableStart, currentTime);
  const currentUnavailableMinutes = calculateTimeDiff('00:00', timeEntries.activeEntry.unavailable);
  
  timeEntries.activeEntry.unavailable = formatMinutes(currentUnavailableMinutes + unavailableMinutes);
  timeEntries.activeEntry.unavailableStart = null;
  
  res.json({ success: true });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Error handling for unhandled errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});