const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const invitationService = require('../services/invitationService');

const router = express.Router();

// ── POST /api/invitations ─────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { accountId, email, name } = req.body;

    const result = await invitationService.createAndSendInvitation(pool, {
      accountId,
      email,
      name,
      invitedBy: req.user.id,
    });

    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating invitation:', err);
    res.status(500).json({ error: 'Error al crear invitación' });
  }
});

// ── POST /api/invitations/accept/:token ───────────────────
router.post('/accept/:token', authMiddleware, async (req, res) => {
  try {
    const result = await invitationService.acceptInvitation(
      pool,
      req.params.token,
      req.user.id,
      req.user.email
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result);
  } catch (err) {
    console.error('Error accepting invitation:', err);
    res.status(500).json({ error: 'Error al aceptar invitación' });
  }
});

module.exports = router;
