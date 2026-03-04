const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────

function generateToken(user) {
  return jwt.sign(
    {
      id:         user.id,
      email:      user.email,
      name:       user.name,
      avatar_url: user.avatar_url,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
}

// ── Routes ────────────────────────────────────────────────

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

/**
 * GET /api/auth/google/callback
 * Google redirects here after user approves
 */
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    console.log('🔁 OAuth callback reached');
    console.log('  err:', err);
    console.log('  user:', user?.email ?? null);
    console.log('  info:', info);

    if (err) {
      console.error('❌ Passport error:', err);
      return res.redirect(`${process.env.FRONTEND_URL}/?error=auth_failed`);
    }
    if (!user) {
      console.error('❌ No user returned. Info:', info);
      return res.redirect(`${process.env.FRONTEND_URL}/?error=auth_failed`);
    }

    const token = generateToken(user);
    console.log('✅ Login OK, redirigiendo con token para:', user.email);
    res.redirect(`${process.env.FRONTEND_URL}/?auth_token=${token}`);
  })(req, res, next);
});

/**
 * GET /api/auth/me
 * Return the current user's profile (requires JWT)
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, name, avatar_url, created_at, updated_at FROM profiles WHERE id = ?',
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * PUT /api/auth/profile
 * Update the current user's display name
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    await pool.execute(
      'UPDATE profiles SET name = ?, updated_at = NOW() WHERE id = ?',
      [name || null, req.user.id]
    );

    const [rows] = await pool.execute(
      'SELECT id, email, name, avatar_url, created_at, updated_at FROM profiles WHERE id = ?',
      [req.user.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

/**
 * POST /api/auth/logout
 * JWT is stateless — client deletes the token.
 * This endpoint is a no-op but kept for symmetry.
 */
router.post('/logout', authMiddleware, (_req, res) => {
  res.json({ success: true });
});

module.exports = router;
