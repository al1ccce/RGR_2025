const crypto = require('crypto');
const fs = require('fs');
const pool = require('../config/db');
const path = require('path');
const logFilePath = path.join(__dirname, '../server.log');

exports.upload = async (req, res) => {
  try {
    console.log('req.file:', req.file);
    const file = req.file;
    const description = req.body.description;
    const type = req.body.type;
    let type_id;
    if (type === "Навигационная карта") {
      type_id = 1;
    } else if (type === "Бортовой журнал") {
      type_id = 2;
    } else {
      type_id = 3;
    }
    console.log('НОВЫЙ ФАЙЛ ЗАГРУЖЕН НА СЕРВЕР:', req.body.description);
    if (!file) {
      return res.status(400).json({ error: 'Файл не загружен. Проверьте, что загруженный файл формата текстового документа или изображения, а его размер < 10 МБ' });
    }

    const fileBuffer = fs.readFileSync(file.path);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const result = await pool.query(
      'INSERT INTO documents (user_id, filename, filepath, checksum, description, type_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user_id, file.originalname, file.path, checksum, description, type_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    const message = `${new Date().toISOString()} - Ошибка загрузки документа: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: err.message });
  }
};


exports.download = async (req, res) => {
  try {
    const document = await pool.query(
      'SELECT filename, filepath, checksum FROM documents WHERE id = $1',
      [req.params.id]
    );
    
    if (!document.rows[0]) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const { filename, filepath, checksum } = document.rows[0];
    const fileBuffer = fs.readFileSync(filepath);
    const currentChecksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    if (currentChecksum !== checksum) {
      return res.status(400).json({ error: 'Контрольная сумма файла не совпадает' });
    }

    res.download(filepath, filename);
    
  } catch (err) {
    const message = `${new Date().toISOString()} - Ошибка скачивания документа: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: err.message });
  }
};

exports.info = async (req, res) => {
  try {
    const document = await pool.query(
      
      'SELECT t.name AS type, d.description, d.uploaded_at, u.username ' +
      'FROM documents d ' +
      'LEFT JOIN users u ON d.user_id = u.id ' +
      'LEFT JOIN types t ON d.type_id = t.id ' +   
      'WHERE d.id = $1',

      [req.params.id]
    );

    if (!document.rows[0]) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const { type, description, uploaded_at, username } = document.rows[0];
    const response = {
      type,
      description: description || 'Пользователь не оставил описания для данного документа.',
      uploaded_at,
      username: username || 'Неизвестный пользователь'
    };

    res.status(200).json(response);
  } catch (err) {
    const message = `${new Date().toISOString()} - Ошибка получения информации о документе: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: err.message });
  }
};

exports.deletee = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const checkDoc = await client.query(
      'SELECT filepath FROM documents WHERE id = $1',
      [id]
    );

    if (checkDoc.rows.length === 0) {
      return res.status(404).json({ error: 'Документ не найден' });
    }
    const filepath = checkDoc.rows[0].filepath;
    await client.query('BEGIN');
    await client.query('DELETE FROM documents WHERE id = $1', [id]);
    fs.unlinkSync(filepath); 
    await client.query('COMMIT');

    res.status(200).json({ message: 'Документ успешно удален' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка при удалении документа:', err);
    const message = `${new Date().toISOString()} - Ошибка удаления документа: ${err.message}\n`;
    fs.appendFileSync(logFilePath, message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

