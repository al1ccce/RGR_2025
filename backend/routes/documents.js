const express = require('express');
const { upload, download, info, deletee } = require('../controllers/documents');
const authMiddleware = require('../middleware/auth');
const uploadMiddleware = require('../middleware/upload');

const router = express.Router();
router.post('/upload', authMiddleware, uploadMiddleware.single('file'), upload);
router.get('/download/:id', authMiddleware, download);
router.get('/info/:id', authMiddleware, info);
router.delete('/delete/:id', authMiddleware, deletee)


module.exports = router;