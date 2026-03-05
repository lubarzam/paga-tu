const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

/**
 * GET /api/admin/stats
 * Global platform statistics
 */
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [[stats]] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM profiles WHERE is_temporary = 0) AS total_users,
        (SELECT COUNT(*) FROM accounts)                         AS total_accounts,
        (SELECT COALESCE(SUM(total), 0) FROM accounts)          AS total_amount
    `);
    res.json(stats);
  } catch (err) {
    console.error('admin/stats error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/admin/users
 * All registered users with account count
 */
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        p.id,
        p.email,
        p.name,
        p.avatar_url,
        p.is_admin,
        p.created_at,
        COUNT(a.id) AS account_count
      FROM profiles p
      LEFT JOIN accounts a ON a.owner_id = p.id
      WHERE p.is_temporary = 0
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('admin/users error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/admin/accounts
 * All accounts across all users
 */
router.get('/accounts', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        a.id,
        a.name,
        p.email           AS owner_email,
        p.name            AS owner_name,
        a.total,
        a.created_at,
        COUNT(ap.id)      AS participant_count,
        CASE
          WHEN (SELECT COUNT(*) FROM account_participants WHERE account_id = a.id AND paid = 0) = 0
          THEN 'pagada'
          ELSE 'pendiente'
        END AS status
      FROM accounts a
      JOIN profiles p ON p.id = a.owner_id
      LEFT JOIN account_participants ap ON ap.account_id = a.id
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('admin/accounts error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
