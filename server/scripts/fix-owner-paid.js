/**
 * One-time migration: mark the account owner's participant row as paid=1
 * for all existing accounts where it is still paid=0.
 *
 * Run with: node server/scripts/fix-owner-paid.js
 */
const pool = require('../src/config/database');

(async () => {
  try {
    const [result] = await pool.execute(
      `UPDATE account_participants ap
       JOIN accounts a ON ap.account_id = a.id
       SET ap.paid = 1
       WHERE ap.participant_id = a.owner_id
         AND ap.paid = 0`
    );
    console.log(`Updated ${result.affectedRows} participant row(s).`);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
