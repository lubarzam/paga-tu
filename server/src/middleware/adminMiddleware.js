const pool = require('../config/database');

const adminMiddleware = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT is_admin FROM profiles WHERE id = ?',
      [req.user.id]
    );
    if (rows.length && rows[0].is_admin === 1) {
      return next();
    }
    return res.status(403).json({ error: 'Acceso denegado: se requieren permisos de administrador' });
  } catch (err) {
    console.error('adminMiddleware error:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = adminMiddleware;
