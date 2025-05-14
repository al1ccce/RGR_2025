// Вход и регистрация
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');
const logFilePath = path.join(__dirname, '../server.log');

exports.register = async (req, res) => {
  const { username, password } = req.body;

  try {

    if (password.length < 4){
      return res.status(400).json({error: 'Ошибка регистрации, пароль должен быть длиньше 4 символов'});
    } 
    else if (username.length === 0) {
      return res.status(400).json({error: 'Ошибка регистрации, поле логина не должно быть пустым'});
    }
    const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *',
      [username, hashedPassword]
    );

    res.status(201).json({ user: newUser.rows[0] });
  } catch (err) {
    const message = `${new Date().toISOString()} - Ошибка регистрации: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await pool.query(`
      SELECT users.*, roles.role as role 
      FROM users
      JOIN roles ON users.role_id = roles.id
      WHERE users.username = $1
    `, [username]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не существует' });
    }

    const isValid = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Неверный пароль' });
    }

    const token = jwt.sign(
      { user_id: user.rows[0].id,
        role: user.rows[0].role},
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    const message = `${new Date().toISOString()} - Ошибка входа: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: err.message });
  }
};