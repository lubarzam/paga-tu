const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// ── POST /api/reminders/send ──────────────────────────────
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { accountId } = req.body;

    // Only the account owner can send reminders
    const [accountRows] = await pool.execute(
      'SELECT * FROM accounts WHERE id = ? AND owner_id = ?',
      [accountId, req.user.id]
    );

    if (!accountRows.length) {
      return res.status(404).json({ error: 'Cuenta no encontrada o sin permisos' });
    }

    const account = accountRows[0];

    const [participants] = await pool.execute(
      'SELECT * FROM account_participants WHERE account_id = ?',
      [accountId]
    );

    // Get owner's banking details to include in the reminder
    const [ownerRows] = await pool.execute(
      `SELECT p.name, p.email,
              bd.bank_name, bd.account_type, bd.account_number, bd.bank_email
       FROM profiles p
       LEFT JOIN banking_details bd ON bd.user_id = p.id
       WHERE p.id = ?`,
      [req.user.id]
    );

    const owner = ownerRows[0] || { name: req.user.name, email: req.user.email };

    const results = [];
    for (const participant of participants) {
      // Never send a reminder to the account owner (they already paid)
      if (participant.participant_id === req.user.id) continue;
      // Skip participants who already paid
      if (participant.paid) continue;

      try {
        await emailService.sendReminderEmail({
          to:                participant.email,
          participantName:   participant.name || participant.email,
          accountName:       account.name,
          accountTotal:      account.total,
          participantAmount: participant.total_amount,
          owner,
        });
        results.push({ success: true, email: participant.email });
      } catch (err) {
        console.error('Error sending reminder to', participant.email, err);
        results.push({ success: false, email: participant.email, error: err.message });
      }
    }

    const successful = results.filter(r => r.success).length;
    res.json({
      success: true,
      message: `Recordatorios enviados a ${successful} de ${results.length} participantes`,
      details: { successful, failed: results.length - successful, results },
    });
  } catch (err) {
    console.error('Error sending reminders:', err);
    res.status(500).json({ error: 'Error al enviar recordatorios' });
  }
});

module.exports = router;
