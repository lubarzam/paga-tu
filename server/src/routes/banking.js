const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ── GET /api/banking-details ──────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM banking_details WHERE user_id = ?',
      [req.user.id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error('Error fetching banking details:', err);
    res.status(500).json({ error: 'Error al obtener datos bancarios' });
  }
});

// ── PUT /api/banking-details ──────────────────────────────
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { bank_name, account_type, account_number, bank_email } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM banking_details WHERE user_id = ?',
      [req.user.id]
    );

    if (existing.length > 0) {
      await pool.execute(
        `UPDATE banking_details
         SET bank_name = ?, account_type = ?, account_number = ?, bank_email = ?, updated_at = NOW()
         WHERE user_id = ?`,
        [bank_name || null, account_type || null, account_number || null, bank_email || null, req.user.id]
      );
    } else {
      const id = uuidv4();
      await pool.execute(
        `INSERT INTO banking_details (id, user_id, bank_name, account_type, account_number, bank_email)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, req.user.id, bank_name || null, account_type || null, account_number || null, bank_email || null]
      );
    }

    const [updated] = await pool.execute(
      'SELECT * FROM banking_details WHERE user_id = ?',
      [req.user.id]
    );
    res.json(updated[0]);
  } catch (err) {
    console.error('Error saving banking details:', err);
    res.status(500).json({ error: 'Error al guardar datos bancarios' });
  }
});

module.exports = router;
