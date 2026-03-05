const { v4: uuidv4 } = require('uuid');

// ── Private helpers ───────────────────────────────────────

/**
 * Find an existing profile by email or create a temporary one.
 * Returns the profile id.
 */
async function createTemporaryProfile(pool, email, name) {
  const [existing] = await pool.execute(
    'SELECT id, name FROM profiles WHERE email = ?',
    [email]
  );

  if (existing.length > 0) {
    // Fill in the name if it was missing and we have one now
    if (name && !existing[0].name) {
      await pool.execute('UPDATE profiles SET name = ? WHERE id = ?', [name, existing[0].id]);
    }
    return existing[0].id;
  }

  const id = uuidv4();
  await pool.execute(
    'INSERT INTO profiles (id, email, name, is_temporary) VALUES (?, ?, ?, 1)',
    [id, email, name || null]
  );
  return id;
}

/**
 * After creating an account, link any account_participants whose email
 * matches a real (non-temporary) profile that already exists.
 */
async function linkRegisteredParticipants(pool, accountId) {
  await pool.execute(
    `UPDATE account_participants ap
     JOIN profiles p ON ap.email = p.email AND p.is_temporary = 0
     SET ap.participant_id = p.id, ap.is_registered = 1
     WHERE ap.account_id = ? AND ap.participant_id IS NULL`,
    [accountId]
  );
}

/**
 * Recalculate each participant's total_amount based on
 * the items they are assigned to and a proportional share of the tip.
 */
async function calculateParticipantTotals(pool, accountId, subtotal, tipAmount) {
  const [participants] = await pool.execute(
    'SELECT id FROM account_participants WHERE account_id = ?',
    [accountId]
  );

  for (const participant of participants) {
    // Sum of (item.amount / number_of_participants_on_that_item) for all items this person is on
    const [itemRows] = await pool.execute(
      `SELECT ai.amount,
              COUNT(ip2.participant_id) AS participant_count
       FROM account_items ai
       JOIN item_participants ip  ON ai.id = ip.item_id  AND ip.participant_id  = ?
       JOIN item_participants ip2 ON ai.id = ip2.item_id
       WHERE ai.account_id = ?
       GROUP BY ai.id, ai.amount`,
      [participant.id, accountId]
    );

    let personSubtotal = 0;
    for (const row of itemRows) {
      personSubtotal += parseFloat(row.amount) / parseInt(row.participant_count, 10);
    }

    let personTip = 0;
    if (subtotal > 0 && tipAmount > 0) {
      personTip = (tipAmount * personSubtotal) / subtotal;
    }

    const personTotal = Math.round((personSubtotal + personTip) * 100) / 100;

    await pool.execute(
      'UPDATE account_participants SET total_amount = ? WHERE id = ?',
      [personTotal, participant.id]
    );
  }
}

// ── Public service ────────────────────────────────────────

const accountService = {

  async createAccount(pool, userId, data) {
    const { name, description, items = [], participants = [], tipIncluded, tipAmount } = data;

    // Totals
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const tip      = parseFloat(tipAmount) || 0;
    const total    = subtotal + tip;

    // Owner profile
    const [profileRows] = await pool.execute(
      'SELECT name, email FROM profiles WHERE id = ?',
      [userId]
    );
    const ownerProfile = profileRows[0] || {};

    // Create account
    const accountId = uuidv4();
    await pool.execute(
      `INSERT INTO accounts (id, name, description, owner_id, subtotal, tip_amount, tip_included, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [accountId, name, description || null, userId, subtotal, tip, tipIncluded ? 1 : 0, total]
    );

    // Ensure temporary profiles exist for each invited participant
    for (const participant of participants) {
      await createTemporaryProfile(pool, participant.email, participant.name);
    }

    // Build the full participant list (owner first, then invitees)
    const allParticipants = [
      { email: ownerProfile.email, name: ownerProfile.name || 'Tu', participantId: userId, isRegistered: true, paid: true },
      ...participants.map(p => ({
        email:         p.email,
        name:          p.name || null,
        participantId: null,
        isRegistered:  false,
        paid:          false,
      })),
    ];

    // Insert participants and collect their DB ids
    const insertedParticipants = [];
    for (const p of allParticipants) {
      const pid = uuidv4();
      await pool.execute(
        `INSERT INTO account_participants (id, account_id, participant_id, email, name, is_registered, paid)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [pid, accountId, p.participantId, p.email, p.name, p.isRegistered ? 1 : 0, p.paid ? 1 : 0]
      );
      insertedParticipants.push({ id: pid, ...p });
    }

    // Insert items and collect their DB ids
    const insertedItems = [];
    for (const item of items) {
      const itemId = uuidv4();
      await pool.execute(
        'INSERT INTO account_items (id, account_id, name, amount) VALUES (?, ?, ?, ?)',
        [itemId, accountId, item.name, parseFloat(item.amount) || 0]
      );
      insertedItems.push({ id: itemId, ...item });
    }

    // Create item ↔ participant relationships
    const ownerParticipant = insertedParticipants.find(p => p.participantId === userId);

    for (let i = 0; i < items.length; i++) {
      const itemRecord      = insertedItems[i];
      const participantNames = items[i].participants || [];

      for (const pName of participantNames) {
        let participant;
        if (pName === 'Tu') {
          participant = ownerParticipant;
        } else {
          participant = insertedParticipants.find(p => p.name === pName);
        }

        if (participant) {
          const ipId = uuidv4();
          await pool.execute(
            'INSERT INTO item_participants (id, item_id, participant_id) VALUES (?, ?, ?)',
            [ipId, itemRecord.id, participant.id]
          );
        }
      }
    }

    // Link any existing registered users that match participant emails
    await linkRegisteredParticipants(pool, accountId);

    // Calculate each participant's share
    await calculateParticipantTotals(pool, accountId, subtotal, tip);

    return { id: accountId, name, description, owner_id: userId, subtotal, tip_amount: tip, tip_included: tipIncluded, total };
  },


  async getAccount(pool, accountId, userId) {
    // Verify user has access (owner or participant)
    const [accountRows] = await pool.execute(
      `SELECT a.* FROM accounts a
       WHERE a.id = ?
         AND (
           a.owner_id = ?
           OR EXISTS (
             SELECT 1 FROM account_participants ap
             WHERE ap.account_id = a.id AND ap.participant_id = ?
           )
         )`,
      [accountId, userId, userId]
    );

    if (!accountRows.length) return null;

    const account = accountRows[0];

    const [items]        = await pool.execute('SELECT * FROM account_items       WHERE account_id = ?', [accountId]);
    const [participants] = await pool.execute('SELECT * FROM account_participants WHERE account_id = ?', [accountId]);

    // Attach participants to each item
    const itemsWithParticipants = await Promise.all(
      items.map(async (item) => {
        const [itemParticipants] = await pool.execute(
          'SELECT participant_id FROM item_participants WHERE item_id = ?',
          [item.id]
        );

        const participantDetails = itemParticipants
          .map(ip => participants.find(ap => ap.id === ip.participant_id))
          .filter(Boolean);

        return { ...item, participants: participantDetails };
      })
    );

    return {
      ...account,
      account_items:        itemsWithParticipants,
      account_participants: participants,
    };
  },


  async getUserAccounts(pool, userId) {
    // Accounts the user owns
    const [owned] = await pool.execute(
      'SELECT * FROM accounts WHERE owner_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Account IDs where the user is a participant (but not owner)
    const [participantRows] = await pool.execute(
      'SELECT DISTINCT account_id FROM account_participants WHERE participant_id = ?',
      [userId]
    );

    let participating = [];
    if (participantRows.length > 0) {
      const ids          = participantRows.map(r => r.account_id);
      const placeholders = ids.map(() => '?').join(',');

      const [partAccounts] = await pool.execute(
        `SELECT a.*, p.name AS owner_name, p.email AS owner_email
         FROM accounts a
         JOIN profiles p ON a.owner_id = p.id
         WHERE a.id IN (${placeholders}) AND a.owner_id != ?`,
        [...ids, userId]
      );

      participating = partAccounts.map(acc => ({
        ...acc,
        profiles: { name: acc.owner_name, email: acc.owner_email },
      }));
    }

    // Merge and de-duplicate
    const all    = [...owned, ...participating];
    const unique = Array.from(new Map(all.map(a => [a.id, a])).values());

    // Enrich each account with participant stats
    const enriched = await Promise.all(
      unique.map(async (account) => {
        const [parts] = await pool.execute(
          'SELECT paid, participant_id, total_amount FROM account_participants WHERE account_id = ?',
          [account.id]
        );

        const totalParticipants = parts.length;
        const paidParticipants  = parts.filter(p => p.paid).length;
        const userParticipant   = parts.find(p => p.participant_id === userId);
        const userAmount        = userParticipant ? parseFloat(userParticipant.total_amount) : 0;

        let status = 'pending';
        if (totalParticipants > 0 && paidParticipants === totalParticipants) {
          status = 'paid';
        } else if (paidParticipants > 0) {
          status = 'partial';
        }

        return {
          ...account,
          participant_count: totalParticipants,
          paid_count:        paidParticipants,
          user_amount:       userAmount,
          status,
        };
      })
    );

    enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return enriched;
  },


  async updateAccount(pool, accountId, data) {
    const { name, description, items = [], tipIncluded, tipAmount } = data;

    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const tip      = parseFloat(tipAmount) || 0;
    const total    = subtotal + tip;

    await pool.execute(
      `UPDATE accounts
       SET name = ?, description = ?, subtotal = ?, tip_amount = ?, tip_included = ?, total = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, description || null, subtotal, tip, tipIncluded ? 1 : 0, total, accountId]
    );

    // Delete existing items (item_participants cascade automatically)
    await pool.execute('DELETE FROM account_items WHERE account_id = ?', [accountId]);

    // Recreate items and restore their participant associations
    for (const item of items) {
      const itemId = uuidv4();
      await pool.execute(
        'INSERT INTO account_items (id, account_id, name, amount) VALUES (?, ?, ?, ?)',
        [itemId, accountId, item.name, parseFloat(item.amount) || 0]
      );

      // item.participants comes from getAccount as an array of account_participant objects
      // each having an 'id' (account_participants.id) — restore those links
      const itemParticipants = Array.isArray(item.participants) ? item.participants : [];
      for (const p of itemParticipants) {
        const participantId = typeof p === 'object' ? p.id : null;
        if (participantId) {
          await pool.execute(
            'INSERT IGNORE INTO item_participants (id, item_id, participant_id) VALUES (?, ?, ?)',
            [uuidv4(), itemId, participantId]
          );
        }
      }
    }

    // Recalculate totals with restored item–participant links
    await calculateParticipantTotals(pool, accountId, subtotal, tip);
  },
};

module.exports = accountService;
