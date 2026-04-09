require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const { createAttendanceRouter } = require('./src/routes/attendance');
const { createStreamRouter } = require('./src/routes/stream');
const { createAuthRouter, createAuthGuard } = require('./src/routes/auth');
const { createAttendanceService } = require('./src/services/attendanceService');

const app = express();
const port = Number(process.env.PORT || 3000);
const authEnabled = String(process.env.AUTH_ENABLED || 'false').toLowerCase() === 'true';

const attendanceService = createAttendanceService({
  appsScriptUrl: process.env.GOOGLE_APPS_SCRIPT_URL || '',
  appsScriptReadQuery: process.env.APPS_SCRIPT_READ_QUERY || '',
  refreshIntervalMs: Number(process.env.REFRESH_INTERVAL_MS || 15000),
  useLocalSampleData: String(process.env.USE_LOCAL_SAMPLE_DATA || 'true').toLowerCase() === 'true',
  sampleDataFile: process.env.SAMPLE_DATA_FILE || 'data/sample-attendance.json',
});
attendanceService.startAutoRefresh();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 8,
  },
}));

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

const authGuard = createAuthGuard({ authEnabled });
app.use('/auth', createAuthRouter({ authEnabled }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  if (!authEnabled || req.session?.isAdmin) {
    return res.redirect('/dashboard');
  }
  return res.redirect('/login');
});

app.get('/dashboard', authGuard, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  if (!authEnabled || req.session?.isAdmin) {
    return res.redirect('/dashboard');
  }
  return res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.use('/attendance', authGuard, createAttendanceRouter(attendanceService));
app.use('/events', authGuard, createStreamRouter(attendanceService));

app.use((req, res) => {
  if (authEnabled && !req.session?.isAdmin) {
    return res.redirect('/login');
  }
  return res.redirect('/dashboard');
});

app.listen(port, () => {
  console.log(`Smart RFID Attendance System running on http://localhost:${port}`);
});