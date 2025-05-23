const pool = require('../config/db')
const fs = require('fs');
const path = require('path');
const logFilePath = path.join(__dirname, '../server.log');

exports.getProf = async (req, res) => {
  const user_id = req.user_id; 

  try {
    const userData = await pool.query(
      'SELECT u.id, u.username, ui.name, ui.surname, ui.email ' + 
      'FROM users u ' + 
      'LEFT JOIN users_info ui ON u.id = ui.user_id ' +
      'WHERE u.id = $1'
    , [user_id]); 

    if (userData.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.status(200).json(userData.rows[0]); 
  } catch (err) {
    const message = `${new Date().toISOString()} - Ошибка получения профиля: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: 'Непредвиденная ошибка на сервере' });
  }
};


exports.updateProf = async (req, res) => {
  const user_id = req.user_id;
  const { username, name, surname, email } = req.body;

  const cleanName = (name || '').trim();
  const cleanSurname = (surname || '').trim();
  const cleanUsername = (username || '').trim();
  const cleanEmail = (email || '').trim();


  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Начинаем транзакцию

    const symbols = /^[a-zA-Zа-яА-ЯёЁ]+$/u; 

    const symbols2 = /^[a-zA-Z0-9_.-]+$/;

    if (!symbols2.test(cleanUsername)) {
      return res.status(400).json({ error: 'Логин содержит недопустимые символы' });
    }

    if (cleanUsername.length < 4 || cleanUsername.length > 50) {
      return res.status(400).json({ error: 'Логин должен содержать от 4 до 50 символов' });
    }

    if (!symbols.test(cleanName)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Имя содержит недопустимые символы.' });
    }

    if (!symbols.test(cleanSurname)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Фамилия содержит недопустимые символы.' });
    }

    if (cleanName.length < 2) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Имя должно быть не короче 2 символов.' });
    }

    if (cleanSurname.length < 2) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Фамилия должна быть не короче 2 символов.' });
    }

    const emailCheck = await client.query(
      'SELECT 1 FROM users_info WHERE email = $1 AND user_id != $2',
      [cleanEmail, user_id]
    );

    const usernameCheck = await client.query(
      'SELECT 1 FROM users WHERE username = $1 AND id != $2',
      [cleanUsername, user_id]
    );

    if (emailCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    if (usernameCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Пользователь с таким username уже существует' });
    }

    // Обновление данных пользователя
    const updatedUser = await client.query(
      'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username',
      [cleanUsername, user_id]
    );

    const updatedUserInfo = await client.query(
      'UPDATE users_info SET name = $1, surname = $2, email = $3 WHERE user_id = $4 RETURNING user_id, name, surname, email',
      [cleanName, cleanSurname, cleanEmail, user_id]
    );

    await client.query('COMMIT'); // Подтверждаем транзакцию

    res.status(200).json({
      message: 'Профиль успешно обновлен',
      updatedUser: updatedUser.rows[0],
      updatedUserInfo: updatedUserInfo.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK'); // Откатываем транзакцию при ошибке
    const message = `${new Date().toISOString()} - Ошибка обновления профиля: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: 'Непредвиденная ошибка на сервере' });
  } finally {
    client.release(); // Освобождаем клиент из пула
  }
};

exports.postApplication = async (req, res) => {
  const user_id = req.user_id;
  const { description } = req.body;
  const client = await pool.connect(); 

  try {
    const check = await client.query(
      'SELECT 1 FROM applications WHERE user_id = $1 AND status_id = 1',
      [user_id]
    );

    if (check.rows.length > 0) {
      return res.status(409).json({
        error: 'Вы уже оставили заявку, она находится в рассмотрении'
      });
    }

    await client.query('BEGIN'); // Начинаем транзакцию
    const application = await client.query(
      'INSERT INTO applications (user_id, description) VALUES ($1, $2)',
      [user_id, description]
    );

    console.log('Новая заявочка: ', user_id, '-', description);

    await client.query('COMMIT'); // Подтверждаем транзакцию

    res.status(200).json({
      message: 'Заявка оформлена',
    });
  } catch (err) {
    await client.query('ROLLBACK'); // Откатываем транзакцию в случае ошибки
    const message = `${new Date().toISOString()} - Ошибка обновления профиля: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: 'Непредвиденная ошибка на сервере' });
  } finally {
    client.release(); // Освобождаем клиент
  }
}

exports.solveApplication = async (req, res) => {
  const { app_id, number } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Начинаем транзакцию
    let status_id = 1;

    if (number === '2') {
      status_id = 2;
    } 
    if (number === '3') {
      status_id = 3;
    }

    const result = await client.query(
      'UPDATE applications SET status_id = $1 WHERE id = $2 RETURNING *',
      [status_id, app_id]
    );

    if (result.rows.length === 0) {
      throw new Error('Заявка не найдена');
    }

    const user_idrow = await client.query(
      'SELECT user_id FROM applications WHERE id = $1',
      [app_id]
    );

    const user_id = user_idrow.rows[0].user_id;

    if (status_id === 2) {
      await client.query(
        'UPDATE users SET role_id = 2 WHERE id = $1',
        [user_id]
      );
    }

    console.log(`Заявка №${app_id} обновлена: статус = ${status_id}`);

    await client.query('COMMIT'); // Фиксируем транзакцию

    res.status(200).json({
      message: `Заявка №${app_id} ${number === '2' ? 'одобрена' : 'отклонена'}`,
    });

  } catch (err) {
    await client.query('ROLLBACK'); // Откатываем транзакцию в случае ошибки
    const message = `${new Date().toISOString()} - Ошибка обработки заявки: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: 'Непредвиденная ошибка на сервере' });
  } finally {
    client.release(); // Освобождаем клиент
  }
};

exports.getDocs= async (req, res) => {
  try {
    const user_id = req.user_id;
    const documents = await pool.query(
      'SELECT id, filename, uploaded_at FROM documents WHERE user_id = $1',
      [user_id]
    );
    res.status(200).json(documents.rows);
  } catch (err) {
    const message = `${new Date().toISOString()} - Ошибка получения документов: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: 'Непредвиденная ошибка на сервере' });
  }
};

exports.getAllDocs = async (req, res) => {
  try {
    const documents = await pool.query(
      'SELECT d.id, t.name AS type, d.filename, d.uploaded_at, u.username AS author ' +
      'FROM documents d ' +
      'JOIN users u ON d.user_id = u.id ' +
      'JOIN types t ON d.type_id = t.id ' +  
      'ORDER BY d.uploaded_at DESC'
    );
      res.status(200).json(documents.rows);
    } catch (err){
      const message = `${new Date().toISOString()} - Ошибка получения документов: ${err.message}\n`;
      fs.appendFileSync(logFilePath, message);
      res.status(500).json({ error: 'Непредвиденная ошибка на сервере' });
    }
};
// Админские
exports.getAllUsers = async (req, res) => {
  try {
    const users = await pool.query('SELECT id, username, is_banned, role_id FROM users');
    res.status(200).json(users.rows);
  } catch (err){
    const message = `${new Date().toISOString()} - Ошибка получения списка пользователей: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: 'Непредвиденная ошибка на сервере' });
  }
}

exports.getApplications = async (req, res) => {
  try {
    const applications = await pool.query('SELECT a.id, u.username, a.description FROM users u JOIN applications a ON u.id = a.user_id WHERE status_id = 1;');
    res.status(200).json(applications.rows);
  } catch (err){
    const message = `${new Date().toISOString()} - Ошибка получения списка пользователей: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: 'Непредвиденная ошибка на сервере' });
  }
}

exports.getUserProf = async (req, res) => {
  const user_id = req.query.user_id;

  try {
    const userData = await pool.query(
      'SELECT u.id, u.username, ui.name, ui.surname, ui.email, bu.comment ' + 
      'FROM users u ' + 
      'LEFT JOIN users_info ui ON u.id = ui.user_id ' +
      'LEFT JOIN banned_users bu ON u.id = bu.user_id ' +
      'WHERE u.id = $1'
    , [user_id]); 

    if (userData.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    res.status(200).json(userData.rows[0]); 
  } catch (err) {
    const message = `${new Date().toISOString()} - Ошибка получения профиля: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: 'Непредвиденная ошибка на сервере' });
  }
};

exports.ban = async (req, res) => {

  const admin_id = req.user_id;
  const { user_id, comment } = req.body;
  const client = await pool.connect();
  console.log('Бан юзера №', user_id, ' админом №', admin_id, ', причина:', comment);

  try {
    if (admin_id === user_id) {
      return res.status(409).json({
        error: 'Нельзя заблокировать самого себя'
      });
    }

    const check_role = await client.query('SELECT role_id FROM users WHERE id = $1', [user_id]);
    if (check_role.rows[0].role_id === 3 || check_role.rows[0].role_id === '3') {
      return res.status(409).json({
        error: 'Нельзя заблокировать главного администратора'
      });
    }

    await client.query('BEGIN'); // Начинаем транзакцию

    const result = await client.query(
      'UPDATE users SET is_banned = TRUE WHERE id = $1 RETURNING *',
      [user_id]
    );

    if (result.rows.length === 0) {
      throw new Error('Пользователь не найден');
    }

    await client.query('INSERT INTO banned_users (user_id, comment, admin_id) VALUES ($1, $2, $3)', [user_id, comment, admin_id]);

    console.log(`Пользователь №${user_id} заблокирован`);

    await client.query('COMMIT'); // Фиксируем транзакцию

    res.status(200).json({
      message: `Пользователь №${user_id} заблокирован`,
    });

  } catch (err) {
    await client.query('ROLLBACK'); // Откатываем транзакцию в случае ошибки
    const message = `${new Date().toISOString()} - Ошибка блокировки пользователя: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: 'Непредвиденная ошибка на сервере' });
  } finally {
    client.release(); // Освобождаем клиент
  }
};

exports.unban = async (req, res) => {

  const admin_id = req.user_id;
  const { user_id } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Начинаем транзакцию

    const result = await client.query(
      'UPDATE users SET is_banned = FALSE WHERE id = $1 RETURNING *',
      [user_id]
    );

    if (result.rows.length === 0) {
      throw new Error('Пользователь не найден');
    }

    await client.query('DELETE FROM banned_users WHERE user_id = $1 AND admin_id = $2', [user_id, admin_id]);

    console.log(`Пользователь №${user_id} разблокирован`);

    await client.query('COMMIT'); // Фиксируем транзакцию

    res.status(200).json({
      message: `Пользователь №${user_id} разблокирован`,
    });

  } catch (err) {
    await client.query('ROLLBACK'); // Откатываем транзакцию в случае ошибки
    const message = `${new Date().toISOString()} - Ошибка разблокировки пользователя: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: 'Непредвиденная ошибка на сервере' });
  } finally {
    client.release(); // Освобождаем клиент
  }
};
