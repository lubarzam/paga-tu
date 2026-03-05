require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');

// Load passport strategy configuration
require('./src/config/passport');

const authRoutes = require('./src/routes/auth');
const accountsRoutes = require('./src/routes/accounts');
const invitationsRoutes = require('./src/routes/invitations');
const remindersRoutes = require('./src/routes/reminders');
const bankingRoutes = require('./src/routes/banking');
const contactsRoutes = require('./src/routes/contacts');
const adminRoutes    = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Session required by Passport to store OAuth state during Google login flow.
// Uses MySQL store so state survives across multiple Node.js workers (cPanel/Passenger).
const sessionStore = new (require('express-mysql-session')(session))({
  host:     process.env.DB_HOST || 'localhost',
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  clearExpired: true,
  checkExpirationInterval: 15 * 60 * 1000,
  expiration: 5 * 60 * 1000, // 5 minutes — only needed during OAuth flow
});

app.use(session({
  secret: process.env.JWT_SECRET || 'oauth-state-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 5 * 60 * 1000,
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/accounts',       accountsRoutes);
app.use('/api/invitations',    invitationsRoutes);
app.use('/api/reminders',      remindersRoutes);
app.use('/api/banking-details', bankingRoutes);
app.use('/api/contacts',       contactsRoutes);
app.use('/api/admin',          adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`PagaTú API running on port ${PORT}`);
});
