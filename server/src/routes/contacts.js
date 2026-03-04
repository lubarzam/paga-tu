const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ── GET /api/contacts/search?q= ───────────────────────────
// Must be defined BEFORE /:id-style routes to avoid ambiguity
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const like = `%${q}%`;
    const [rows] = await pool.execute(
      `SELECT id, name, email, usage_count, last_used_at
       FROM frequent_contacts
       WHERE user_id = ? AND (name LIKE ? OR email LIKE ?)
       ORDER BY usage_count DESC, last_used_at DESC
       LIMIT 10`,
      [req.user.id, like, like]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error searching contacts:', err);
    res.status(500).json({ error: 'Error al buscar contactos' });
  }
});

// ── GET /api/contacts ─────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, email, usage_count, last_used_at
       FROM frequent_contacts
       WHERE user_id = ?
       ORDER BY usage_count DESC, last_used_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ error: 'Error al obtener contactos' });
  }
});

// ── POST /api/contacts ────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM frequent_contacts WHERE user_id = ? AND email = ?',
      [req.user.id, email]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE frequent_contacts
         SET name = ?, usage_count = usage_count + 1, last_used_at = NOW()
         WHERE id = ?`,
        [name, existing[0].id]
      );
    } else {
      const id = uuidv4();
      await pool.execute(
        `INSERT INTO frequent_contacts (id, user_id, name, email, usage_count, last_used_at)
         VALUES (?, ?, ?, ?, 1, NOW())`,
        [id, req.user.id, name, email]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving contact:', err);
    res.status(500).json({ error: 'Error al guardar contacto' });
  }
});

module.exports = router;
