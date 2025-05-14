const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'storage/');
  },
  filename: (req, file, cb) => {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, file.originalname + '-' + Date.now().toString());
  }
});

const fileFilter = (req, file, cb) => {
  const types = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
    'text/plain', 
    'image/jpeg', 
    'image/png' 
  ];

  if (types.includes(file.mimetype)) {
    cb(null, true); 
  } else {
    cb(new Error('Недопустимый тип файла'), false); 
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

module.exports = upload;