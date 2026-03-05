const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');
const accountService = require('../services/accountService');
const invitationService = require('../services/invitationService');
const receiptService = require('../services/receiptService');

const router = express.Router();

// ── GET /api/accounts ─────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const accounts = await accountService.getUserAccounts(pool, req.user.id);
    res.json(accounts);
  } catch (err) {
    console.error('Error fetching accounts:', err);
    res.status(500).json({ error: 'Error al obtener cuentas' });
  }
});

// ── POST /api/accounts ────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const account = await accountService.createAccount(pool, req.user.id, req.body);

    // Send invitation emails (best-effort, errors don't fail the request)
    const participants = req.body.participants || [];
    for (const participant of participants) {
      try {
        await invitationService.createAndSendInvitation(pool, {
          accountId:  account.id,
          email:      participant.email,
          name:       participant.name,
          invitedBy:  req.user.id,
        });
      } catch (err) {
        console.error('Error sending invitation to', participant.email, err);
      }
    }

    res.status(201).json(account);
  } catch (err) {
    console.error('Error creating account:', err);
    res.status(500).json({ error: 'Error al crear cuenta' });
  }
});

// ── GET /api/accounts/:id ─────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const account = await accountService.getAccount(pool, req.params.id, req.user.id);
    if (!account) {
      return res.status(404).json({ error: 'Cuenta no encontrada' });
    }
    res.json(account);
  } catch (err) {
    console.error('Error fetching account:', err);
    res.status(500).json({ error: 'Error al obtener cuenta' });
  }
});

// ── PUT /api/accounts/:id ─────────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT owner_id FROM accounts WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length || rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para modificar esta cuenta' });
    }

    await accountService.updateAccount(pool, req.params.id, req.body);
    res.json({ id: req.params.id });
  } catch (err) {
    console.error('Error updating account:', err);
    res.status(500).json({ error: 'Error al actualizar cuenta' });
  }
});

// ── DELETE /api/accounts/:id ──────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT owner_id FROM accounts WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length || rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar esta cuenta' });
    }

    // Cascading FK constraints handle related rows automatically
    await pool.execute('DELETE FROM accounts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Error al eliminar cuenta' });
  }
});

// ── PUT /api/accounts/:id/participants/:pid/paid ──────────
router.put('/:id/participants/:pid/paid', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT owner_id FROM accounts WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length || rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    await pool.execute(
      'UPDATE account_participants SET paid = 1 WHERE id = ? AND account_id = ?',
      [req.params.pid, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error marking as paid:', err);
    res.status(500).json({ error: 'Error al marcar como pagado' });
  }
});

// ── POST /api/accounts/scan-receipt ───────────────────────
router.post('/scan-receipt', authMiddleware, async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image || !mimeType) {
      return res.status(400).json({ error: 'Se requiere image y mimeType' });
    }
    const items = await receiptService.extractItemsFromReceipt(image, mimeType);
    res.json({ items });
  } catch (err) {
    console.error('Error scanning receipt:', err);
    res.status(500).json({ error: 'No se pudo analizar la boleta' });
  }
});

module.exports = router;
