const jwt = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = (true_role) => async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Необходимо авторизоваться' });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user_id = decoded.user_id;
  
      const userResult = await pool.query(
        'SELECT u.role_id, r.role AS role FROM users u ' + 
        'JOIN roles r ON u.role_id = r.id ' +
        'WHERE u.id = $1', [decoded.user_id]);
      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Пользователь не найден' });
      }
  
      const user = userResult.rows[0];
      
      if (true_role && user.role !== true_role) {
        return res.status(403).json({ error: 'Доступ запрещён: недостаточно прав' });
      }
  
      next();
    } catch (err) {
      res.status(401).json({ error: 'Неверный токен' });
    }
  };