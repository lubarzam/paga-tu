const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { v4: uuidv4 } = require('uuid');
const pool = require('./database');

// Stubs required when passport.session() middleware is used
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id }));

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${process.env.FRONTEND_URL}/api/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      console.log('🔍 Passport verify callback ejecutado para:', profile?.emails?.[0]?.value);
      try {
        const email     = profile.emails[0].value;
        const name      = profile.displayName;
        const avatarUrl = profile.photos?.[0]?.value ?? null;

        // Find existing profile (could be a real user or a temporary one)
        const [rows] = await pool.execute(
          'SELECT * FROM profiles WHERE email = ?',
          [email]
        );

        let user;
        if (rows.length > 0) {
          user = rows[0];
          // Promote temporary profile to real user; fill in any missing fields
          await pool.execute(
            `UPDATE profiles
             SET name        = COALESCE(name, ?),
                 avatar_url  = COALESCE(avatar_url, ?),
                 is_temporary = 0,
                 updated_at  = NOW()
             WHERE id = ?`,
            [name, avatarUrl, user.id]
          );
          user = { ...user, name: user.name || name, avatar_url: user.avatar_url || avatarUrl, is_temporary: 0 };
        } else {
          const id = uuidv4();
          await pool.execute(
            'INSERT INTO profiles (id, email, name, avatar_url, is_temporary) VALUES (?, ?, ?, ?, 0)',
            [id, email, name, avatarUrl]
          );
          user = { id, email, name, avatar_url: avatarUrl, is_temporary: 0 };
        }

        // Link any pending guest participations to this real profile
        await linkRegisteredParticipants(email, user.id);

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

/**
 * After a user registers/logs in, update any account_participants rows
 * that share their email but have no participant_id yet.
 */
async function linkRegisteredParticipants(email, userId) {
  try {
    await pool.execute(
      `UPDATE account_participants
       SET participant_id = ?, is_registered = 1
       WHERE email = ? AND participant_id IS NULL`,
      [userId, email]
    );
  } catch (err) {
    console.error('Error linking registered participants:', err);
  }
}

module.exports = passport;
