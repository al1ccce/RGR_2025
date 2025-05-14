const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Необходимо авторизоваться' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user_id = decoded.user_id; 
    next();
  } catch (err) {
    res.status(401).json({ error: 'Неверный токен' });
  }
};