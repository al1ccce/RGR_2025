const jwt = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Необходимо авторизоваться' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user_id = decoded.user_id; 

    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.user_id]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const user = userResult.rows[0];
    if (user.is_banned) {
      return res.status(403).json({ error: 'Доступ запрещён: пользователь заблокирован' });
    }

    next();
  } catch (err) {
    res.status(401).json({ error: 'Неверный токен' });
  }
};

