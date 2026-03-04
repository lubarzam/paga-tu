require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');

// Load passport strategy configuration
require('./src/config/passport');

const authRoutes = require('./src/routes/auth');
const accountsRoutes = require('./src/routes/accounts');
const invitationsRoutes = require('./src/routes/invitations');
const remindersRoutes = require('./src/routes/reminders');
const bankingRoutes = require('./src/routes/banking');
const contactsRoutes = require('./src/routes/contacts');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/accounts',       accountsRoutes);
app.use('/api/invitations',    invitationsRoutes);
app.use('/api/reminders',      remindersRoutes);
app.use('/api/banking-details', bankingRoutes);
app.use('/api/contacts',       contactsRoutes);

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
