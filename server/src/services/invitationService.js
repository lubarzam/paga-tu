const { v4: uuidv4 } = require('uuid');
const emailService = require('./emailService');

const invitationService = {

  async createAndSendInvitation(pool, { accountId, email, name, invitedBy }) {
    // Verify the inviter owns the account and get details for the email
    const [accountRows] = await pool.execute(
      `SELECT a.name AS account_name, p.name AS inviter_name
       FROM accounts a
       JOIN profiles p ON a.owner_id = p.id
       WHERE a.id = ? AND a.owner_id = ?`,
      [accountId, invitedBy]
    );

    if (!accountRows.length) {
      throw new Error('Cuenta no encontrada o sin permisos');
    }

    const { account_name, inviter_name } = accountRows[0];

    // Generate a secure random token
    const token        = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
    const invitationId = uuidv4();

    await pool.execute(
      `INSERT INTO invitations (id, account_id, email, name, invited_by, token, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [invitationId, accountId, email, name || null, invitedBy, token]
    );

    await emailService.sendInvitationEmail({
      to:          email,
      inviteeName: name || 'Invitado',
      accountName: account_name,
      inviterName: inviter_name,
      token,
    });

    return { id: invitationId, token };
  },


  async acceptInvitation(pool, token, userId, userEmail) {
    const [invitations] = await pool.execute(
      `SELECT * FROM invitations
       WHERE token = ? AND status = 'pending' AND expires_at > NOW() AND email = ?`,
      [token, userEmail]
    );

    if (!invitations.length) {
      return { success: false, error: 'Invitación inválida o expirada' };
    }

    const invitation = invitations[0];

    // Check if user is already a participant (by profile id or email)
    const [existing] = await pool.execute(
      `SELECT id FROM account_participants
       WHERE account_id = ? AND (participant_id = ? OR email = ?)`,
      [invitation.account_id, userId, userEmail]
    );

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE account_participants SET participant_id = ?, is_registered = 1 WHERE id = ?',
        [userId, existing[0].id]
      );
    } else {
      const id = uuidv4();
      await pool.execute(
        `INSERT INTO account_participants (id, account_id, participant_id, email, name, is_registered)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [id, invitation.account_id, userId, userEmail, invitation.name]
      );
    }

    await pool.execute(
      "UPDATE invitations SET status = 'accepted' WHERE id = ?",
      [invitation.id]
    );

    return { success: true, account_id: invitation.account_id };
  },
};

module.exports = invitationService;
